const log4js = require('log4js');
const axios = require('axios').default;
const CONFIG = require('../../../../config');
const userBll = require('../../../shared/database/user/user.bll');
const stateBll = require('../../../shared/database/state/state.bll');
const entityBll = require('../../../shared/database/entity/entity.bll');
const sessionBll = require('../../../shared/database/session/session.bll');
const geolocationBll = require('../../../shared/database/geolocation/geolocation.bll');
const { sleep } = require('../../../shared/helpers/global.helper');
const { getDeviceInfo } = require('../../../shared/helpers/device.helper');

const logger = log4js.getLogger('SOCKET');
logger.level = 'debug';

const MAX_SESSIONS = 10;
const CLIENT_DISCONNECTION_WITHOUT_AGENTS_TIME = 30000;

let sockets = [];
let inactiveTime = 0;
let maxSocketConnections = 0;
let isConnectionWithoutAgentsValidationActive = true;

async function initializeValidators() {
    const statesResponse = await stateBll.find({});
    const [state] = statesResponse.states;
    if (!state) return;
    inactiveTime = state.inactiveTime;
    maxSocketConnections = state.maxSocketConnections;
    isConnectionWithoutAgentsValidationActive = state.isConnectionWithoutAgentsValidationActive;
}

function setMaxConnections(value) {
    maxSocketConnections = value;
}

function setSocketInactivityTime(value) {
    inactiveTime = value;
}

function setConnectionWithoutAgentsValidation(isActive) {
    isConnectionWithoutAgentsValidationActive = !!isActive;
}

function getConnections() {
    return sockets.map(s => (
        {
            user: s.user,
            isAgent: s.isAgent,
            entityId: s.entityId,
            sessionId: s.sessionId,
        }
    ));
}

function checkUserConnection(userId) {
    if (!userId) return false;
    const agentSocketsData = getUserSocketsData(userId);
    if (!agentSocketsData || !agentSocketsData.length) return true;
    return false;
}

function getSocketData(id) {
    if (!id) return undefined;
    return sockets.find(s => s.id === id);
}

function getRequestingCoBrowsingSocketData(userId, sessionId) {
    if (!userId || !sessionId) return undefined;
    return sockets.find(s => (
        s.isCobrowsingRequest &&
        s.userId &&
        s.userId.toString() === userId.toString() &&
        s.sessionId &&
        s.sessionId.toString() === sessionId.toString()
    ));
}

function getEntityFromSessionId(sessionId) {
    if (!sessionId) return null;
    const socketData = sockets.find(s => s.sessionId && s.sessionId.toString() === sessionId.toString());
    if (!socketData) return null;
    return socketData.entityId;
}

function getEntityFromUserId(userId) {
    if (!userId) return null;
    const socketData = sockets.find(s => s.userId && s.userId.toString() === userId.toString());
    if (!socketData) return null;
    return socketData.entityId;
}

function getClientCallSocketData(sessionId) {
    if (!sessionId) return null;
    return sockets.find(s => s.appId === CONFIG.AGORA_APP_ID && s.relatedSessionId && s.relatedSessionId.toString() === sessionId.toString());
}

function getAgentCallSocketData(userId) {
    if (!userId) return null;
    return sockets.find(s => s.appId === CONFIG.AGORA_APP_ID && s.relatedUserId && s.relatedUserId.toString() === userId.toString());
}

function getSessionSockets(entityId, sessionId) {
    if (!sessionId || !entityId) return [];
    return sockets.filter(s => s.entityId && s.entityId.toString() === entityId.toString() && s.sessionId && s.sessionId.toString() === sessionId.toString());
}

function getUserSocketsData(userId) {
    if (!userId) return [];
    return sockets.filter(s => s.userId && s.userId.toString() === userId.toString());
}

function getAgentSocketDataByUserId(entityId, userId) {
    if (!entityId || !userId) return undefined;
    return sockets.find(s => s.isAgent && s.entityId && s.entityId.toString() === entityId.toString() && s.userId.toString() === userId.toString());
}

function getObserversSocketsData(entityId) {
    if (!entityId) return [];
    return sockets.filter(s => s.entityId && s.entityId.toString() === entityId.toString() && s.isAgent);
}

function getObserverSocketDataByCode(entityId, code) {
    if (!entityId || !code) return undefined;
    return sockets.find(s => s.isAgent && s.entityId && s.entityId.toString() === entityId.toString() && s.user && s.user.code === code);
}

function getClientsSocketsData(entityId) {
    if (!entityId) return [];
    return sockets.filter(s => s.entityId && s.entityId.toString() === entityId.toString() && !s.isAgent && s.sessionId);
}

function getClientSocketDataBySessionId(entityId, sessionId) {
    if (!sessionId || !entityId) return undefined;
    return sockets.find(s => s.entityId && s.entityId.toString() === entityId.toString() && !s.isAgent && s.sessionId && s.sessionId.toString() === sessionId.toString());
}

function getObserversSocketsDataBySessionId(entityId, sessionId) {
    if (!sessionId || !entityId) return [];
    return sockets.filter(s => s.entityId && s.entityId.toString() === entityId.toString() && s.sessionId && s.sessionId.toString() === sessionId.toString() && s.isAgent);
}

function removeSocket(id) {
    if (!id) return;
    const index = sockets.findIndex(s => s.id === id);
    sockets.splice(index, 1);
}

async function getGeolocation(ip) {
    if (!ip) return {};
    const geolocationResponse = await geolocationBll.find({ ip });
    const [geolocation] = geolocationResponse.geolocations;
    if (geolocation) return geolocation;
    return new Promise((resolve) => {
        axios.get(`https://ipapi.co/${ip}/json/`)
            .then((response) => {
                const newGeolocation = response.data;
                geolocationBll.insertOne(newGeolocation);
                resolve(newGeolocation);
            })
            .catch((error) => {
                logger.error(error);
                resolve({});
            });
    });
}

async function createSession(entityId, ip) {
    if (!entityId) return {};
    let geolocation = {};
    if (ip) geolocation = await getGeolocation(ip);
    const sessionParsed = { ip, geolocation };
    const session = await sessionBll.insertOne(entityId, sessionParsed);
    return session;
}

function notifyNewConnectionToObservers(entityId, session, uid) {
    if (!entityId || !session || !session._id) return;
    const clientsSocketsData = getClientsSocketsData(entityId);
    const observersSocketsData = getObserversSocketsData(entityId);
    const totalObservers = observersSocketsData.length;
    const searchResult = searchSessions(entityId, null, {}, '');
    let { total } = searchResult;
    total += 1;
    for (let i = 0; i < totalObservers; i += 1) {
        const observerSocketData = observersSocketsData[i];
        if (clientsSocketsData && clientsSocketsData.length >= MAX_SESSIONS && session._id.toString() !== observerSocketData.sessionId) {
            continue;
        }

        observerSocketData.socket.emit('new-session', { uid, session, total });
    }
}

function handleCallDisconnection(socketData) {
    const { entityId, relatedSessionId, relatedUserId } = socketData;
    if (relatedUserId) {
        const agentSocketsData = getUserSocketsData(relatedUserId);
        if (!agentSocketsData || !agentSocketsData.length) return;
        const totalAgentSocketsData = agentSocketsData.length;
        for (let i = 0; i < totalAgentSocketsData; i += 1) {
            const agentSocketData = agentSocketsData[i];
            agentSocketData.socket.emit('call-ended', {});
        }
    } else if (relatedSessionId) {
        const clientSocketData = getClientSocketDataBySessionId(entityId, relatedSessionId);
        if (!clientSocketData) return;
        clientSocketData.socket.emit('call-ended', {});
        const { session, sessionId } = clientSocketData;
        session.callUrl = '';
        const observersSocketsData = getObserversSocketsDataBySessionId(entityId, sessionId);
        const totalObservers = observersSocketsData.length;
        for (let i = 0; i < totalObservers; i += 1) {
            const observerSocketData = observersSocketsData[i];
            observerSocketData.socket.emit('client-left-call', { sessionId });
        }
    }
}

function notifyRemoveConnectionToObservers(entityId, session) {
    if (!entityId || !session || !session._id) return;
    const searchResult = searchSessions(entityId, null, {}, '');
    const { total } = searchResult;
    const sessionSocketsData = getObserversSocketsData(entityId);
    const totalSockets = sessionSocketsData.length;
    for (let i = 0; i < totalSockets; i += 1) {
        const observerSocketData = sessionSocketsData[i];
        observerSocketData.socket.emit('remove-session', { sessionId: session._id, total });
    }
}

function parseLocation(location) {
    if (!location) return '';
    let locationParsed = location.replace(/{equals}/g, '=');
    locationParsed = locationParsed.replace(/{ampersand}/g, '&');
    return locationParsed;
}

function handleAgentDisconnection(socketData) {
    if (!socketData) return;
    const { entityId, sessionId } = socketData;
    if (!entityId) return;
    handleForceClientsSocketsDisconnection(entityId);
    if (!sessionId) return;
    const clientSocketData = getClientSocketDataBySessionId(entityId, sessionId);
    if (!clientSocketData) return;
    setTimeout((args) => {
        if (!args || !args[0]) return;
        const socketData = args[0];
        const { entityId, sessionId, userId, user } = socketData;
        const reconnectedSocketData = getAgentSocketDataByUserId(entityId, userId);
        if (reconnectedSocketData && reconnectedSocketData.sessionId === sessionId) return;
        user.isCobrowsing = false;
        user.isCobrowsingRequest = false;
        agentStopCoBrowsing(socketData);
        const observersSocketsData = getObserversSocketsData(entityId);
        const totalObservers = observersSocketsData.length;
        for (let i = 0; i < totalObservers; i += 1) {
            const observerSocketData = observersSocketsData[i];
            observerSocketData.socket.emit('remove-watcher', { userId });
        }
    }, 5000, [socketData]);
}

function checkAgentsConnected(entityId) {
    if (!isConnectionWithoutAgentsValidationActive) return true;
    const observersSocketsData = getObserversSocketsData(entityId);
    const hasAgentsConnected = !!observersSocketsData && !!observersSocketsData.length;
    return hasAgentsConnected;
}

function handleForceClientsSocketsDisconnection(entityId) {
    setTimeout(() => {
        const hasAgentsConnected = checkAgentsConnected(entityId);
        if (hasAgentsConnected) return;
        const clientsSocketsData = getClientsSocketsData(entityId);
        const totalClients = clientsSocketsData.length;
        for (let i = 0; i < totalClients; i += 1) {
            const clientSocketData = clientsSocketsData[i];
            if (clientSocketData.forceConnection) continue;
            clientSocketData.socket.emit('force-disconnection', {});
        }
    }, CLIENT_DISCONNECTION_WITHOUT_AGENTS_TIME);
}

function getSmartLinkSession(entityId, code) {
    const socketsData = getClientsSocketsData(entityId);
    if (!socketsData || !socketsData.length) return null;
    const socketData = socketsData.find(s => s.session && s.session.userCode === code);
    if (!socketData || socketData.smartLinkResponded) return null;
    return socketData.session;
}

function checkSpecialSession(session, user, sessionId) {
    if (
        (sessionId && session._id.toString() === sessionId.toString()) ||
        session.isHelpRequest ||
        session.isCustomFlowTriggered ||
        (user && user.code && user.code === session.userCode)
    ) return true;
    return false;
}

function searchSessionsFunction(session, searchString) {
    if (!session) return false;
    if (!searchString) return true;
    const search = searchString.toLowerCase();
    if (session.pin && session.pin.toLowerCase() === search) return true;
    if (session.ip && session.ip.toLowerCase().includes(search)) return true;
    if (session.clientName && session.clientName.toLowerCase().includes(search)) return true;
    const locations = session.locations;
    if (locations && locations.length) {
        const lastLocationIndex = session.locations.length - 1;
        const currentLocation = session.locations[lastLocationIndex];
        if (currentLocation && currentLocation.toLowerCase().includes(search)) return true;
    }

    if (session.metadata) {
        const values = Object.values(session.metadata);
        if (values && values.length) {
            const match = values.some(v => v.toString().toLowerCase().includes(search));
            if (match) return true;
        }
    }

    if (session.geolocation) {
        if (session.geolocation.city && session.geolocation.city.toLowerCase().includes(search)) return true;
        if (session.geolocation.region && session.geolocation.region.toLowerCase().includes(search)) return true;
        if (session.geolocation.postal && session.geolocation.postal.toLowerCase().includes(search)) return true;
        if (session.geolocation.country_name && session.geolocation.country_name.toLowerCase().includes(search)) return true;
    }

    return false;
}

function getSortValue(user, sessionId, session) {
    if (session._id.toString() === sessionId) return 1;
    if (user && session.userCode === user.code) return 2;
    if (session.isHelpRequest) return 3;
    if (session.isCustomFlowTriggered) return 4;
}

function getSearchResult(clientsData, user, searchData, sessionId) {
    const { searchString, skip, limit } = searchData;
    const skipSanitized = skip || 0;
    const limitSanitized = limit || MAX_SESSIONS;
    let total = skipSanitized;
    const result = [];
    const totalClients = clientsData.length;
    for (let i = skipSanitized; i < totalClients; i += 1) {
        const clientData = clientsData[i];
        const { sessions } = clientData;
        const totalClientSessions = sessions.length;
        for (let j = 0; j < totalClientSessions; j += 1) {
            const session = sessions[j];
            const isSpecialSession = checkSpecialSession(session, user, sessionId);
            let isValid = isSpecialSession;
            if (!isSpecialSession) isValid = searchSessionsFunction(session, searchString);
            if (isValid) {
                total += 1;
                if (result.length < limitSanitized) result.push(clientData);
                break;
            }
        }
    }

    return { result, total };
}

function getNewClientData(uid, session) {
    const firstConnectionTime = parseInt(uid.substr(24));
    const firstConnectionDate = new Date(firstConnectionTime);
    return {
        customer: {
            uid,
            firstConnectionDate,
            name: session ? session.clientName : '',
            city: session && session.geolocation ? session.geolocation.city : '',
        },
        sessions: [session],
    };
}

function sortSessions(user, sessionId, sessions) {
    if (!sessions || sessions.length < 2) return sessions;
    return sessions.sort((a, b) => {
        const value1 = getSortValue(user, sessionId, a);
        const value2 = getSortValue(user, sessionId, b);
        if (value1 && value2) return value1 - value2;
        if (value1 && !value2) return -1 * value1;
        if (!value1 && value2) return value2;
        return 0;
    });
}

function groupSessionsByUid(socketsData, user, sessionId) {
    const groupClientData = [];
    const totalSockets = socketsData.length;
    for (let i = 0; i < totalSockets; i += 1) {
        const socketData = socketsData[i];
        const { uid, session, isCobrowsing } = socketData;
        if (!session || !uid) continue;
        session.isCobrowsing = isCobrowsing;
        let clientData = groupClientData.find(cd => cd.customer.uid === uid);
        if (!clientData) {
            clientData = getNewClientData(uid, session);
            groupClientData.push(clientData);
            continue;
        }

        clientData.sessions.push(session);
        clientData.sessions = sortSessions(user, sessionId, clientData.sessions);
    }

    return groupClientData;
}

function searchSessions(entityId, user, searchData, sessionId) {
    if (!entityId) return [];
    const clientsSocketsData = getClientsSocketsData(entityId);
    const clientsData = groupSessionsByUid(clientsSocketsData, user, sessionId);
    const searchResult = getSearchResult(clientsData, user, searchData, sessionId);
    return searchResult;
}

function sendRecoveredSession(socket, entityId, sessionId, session) {
    setTimeout(() => {
        const watchersSocketsData = getObserversSocketsDataBySessionId(entityId, sessionId);
        const hasWatchers = watchersSocketsData.length;
        const observersCoBrowsing = watchersSocketsData.filter(o => o.isCobrowsing);
        const observerRequesting = watchersSocketsData.find(o => o.isCobrowsingRequest);
        const agentsCoBrowsing = observersCoBrowsing.map(o => o.user);
        const agentRequesting = observerRequesting ? observerRequesting.user : undefined;
        const clientCallSocketData = getClientCallSocketData(sessionId);
        const callUrl = clientCallSocketData ? clientCallSocketData.location : null;
        const isOnCall = !!clientCallSocketData;
        const data = { session, agentsCoBrowsing, agentRequesting, emit: hasWatchers, isOnCall };
        socket.emit('session-recovered', data);
        const observersSocketsData = getObserversSocketsData(entityId);
        const totalObservers = observersSocketsData.length;
        for (let i = 0; i < totalObservers; i += 1) {
            const observerSocketData = observersSocketsData[i];
            observerSocketData.socket.emit('client-join-call', { sessionId, callUrl });
        }
    }, 3000);
}

async function forceLogout(userId) {
    if (!userId) return;
    const agentSocketsData = getUserSocketsData(userId);
    if (!agentSocketsData || !agentSocketsData.length) return;
    const totalAgentSocketsData = agentSocketsData.length;
    for (let i = 0; i < totalAgentSocketsData; i += 1) {
        const agentSocketData = agentSocketsData[i];
        agentSocketData.socket.emit('force-logout', {});
    }

    await sleep(1000);
}

function setStartCoBrowsingInfo(entityId, session) {
    if (!entityId || !session) return [];
    let coBrowsingInfo = session.coBrowsingInfo;
    const newItem = { startDate: new Date() };
    if (!coBrowsingInfo) coBrowsingInfo = [newItem];
    else coBrowsingInfo.push(newItem);
    const sessionParsed = { _id: session._id, coBrowsingInfo };
    sessionBll.updateOne(entityId, sessionParsed);
    return coBrowsingInfo;
}

function setEndCobrowsingInfo(entityId, session) {
    if (!entityId || !session) return [];
    let coBrowsingInfo = session.coBrowsingInfo;
    const endDate = new Date();
    if (!coBrowsingInfo) coBrowsingInfo = [{ endDate }];
    else {
        const lastItem = coBrowsingInfo[coBrowsingInfo.length - 1];
        lastItem.endDate = endDate;
    }

    const sessionParsed = { _id: session._id, coBrowsingInfo };
    sessionBll.updateOne(entityId, sessionParsed);
    return coBrowsingInfo;
}

async function setEndCobrowsingInfoFromSessionId(entityId, sessionId) {
    if (!entityId || !sessionId) return;
    const sessionsResponse = await sessionBll.find(entityId, { _id: sessionId });
    const [session] = sessionsResponse.sessions;
    if (!session) return;
    let coBrowsingInfo = session.coBrowsingInfo;
    const endDate = new Date();
    if (!coBrowsingInfo) coBrowsingInfo = [{ endDate }];
    else {
        const lastItem = coBrowsingInfo[coBrowsingInfo.length - 1];
        lastItem.endDate = endDate;
    }

    const sessionParsed = { _id: session._id, coBrowsingInfo };
    sessionBll.updateOne(entityId, sessionParsed);
}

async function updateSessionLocation(entityId, session, location) {
    if (!entityId || !session || !location) return session;
    let sessionUpdated = session;
    const locations = session.locations || [];
    if (!locations || !locations.length) {
        const sessionParsed = { _id: session._id, locations: [location] };
        sessionUpdated = await sessionBll.updateOne(entityId, sessionParsed);
    } else {
        const lastIndex = session.locations.length - 1;
        if (session.locations[lastIndex] !== location) {
            locations.push(location);
            const sessionParsed = { _id: session._id, locations };
            sessionUpdated = await sessionBll.updateOne(entityId, sessionParsed);
        }
    }

    return sessionUpdated;
}

function agentStopCoBrowsing(socketData) {
    if (!socketData) return;
    socketData.isCobrowsing = false;
    if (socketData.socket) {
        socketData.socket.emit('co-browsing-stopped', {});
        socketData.socket.emit('set-session-disconnected', {});
    }

    const { entityId, sessionId, user } = socketData;
    user.isCobrowsing = false;
    const observersSocketsData = getObserversSocketsDataBySessionId(entityId, sessionId);
    const nobodyIsCobrowsing = !observersSocketsData.some(o => o.isCobrowsing);
    const totalObservers = observersSocketsData.length;
    for (let i = 0; i < totalObservers; i += 1) {
        const observerSocketData = observersSocketsData[i];
        observerSocketData.socket.emit('update-watcher', user);
    }

    const clientSocketData = getClientSocketDataBySessionId(entityId, sessionId);
    if (!clientSocketData) {
        setEndCobrowsingInfoFromSessionId(entityId, sessionId);
        return;
    }

    const { session, isCobrowsing } = clientSocketData;
    const newCoBrowsingInfo = setEndCobrowsingInfo(entityId, session);
    session.coBrowsingInfo = newCoBrowsingInfo;
    session.userCode = null;
    session.isCobrowsing = isCobrowsing;
    for (let i = 0; i < totalObservers; i += 1) {
        const observerSocketData = observersSocketsData[i];
        observerSocketData.socket.emit('update-session', session);
    }

    clientSocketData.socket.emit('agent-left', { userId: socketData.userId });
    if (nobodyIsCobrowsing) clientSocketData.socket.emit('co-browsing-stopped', {});
}

async function handleEntityScriptLocation(entityId, location) {
    if (!entityId || !location) return;
    const entitiesResponse = await entityBll.find({ _id: entityId });
    const [entity] = entitiesResponse.entities;
    if (!entity) return;
    const protocolIndex = location.indexOf('//');
    const length = location.indexOf('/', protocolIndex + 2);
    let scriptOrigin = location;
    if (length !== -1) scriptOrigin = location.substr(0, length);
    const scriptOrigins = entity.scriptOrigins || [];
    if (scriptOrigins.includes(scriptOrigin)) return;
    scriptOrigins.push(scriptOrigin);
    entityBll.updateOne({ _id: entityId, scriptOrigins });
}

async function handleNewSocket(socket, forceConnection) {
    let relatedUserId;
    let relatedSessionId;
    const uid = socket.handshake.query.uid;
    const appId = socket.handshake.query.appId;
    const channel = socket.handshake.query.channel;
    let userId = socket.handshake.query.userId;
    let entityId = socket.handshake.query.entityId;
    let sessionId = socket.handshake.query.sessionId;
    let location = socket.handshake.query.location || '';
    const isAgent = socket.handshake.query.isAgent === 'true';
    const ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address.address;
    location = parseLocation(location);
    handleEntityScriptLocation(entityId, location);
    let session;
    let user = {};
    if (appId === CONFIG.AGORA_APP_ID) {
        if (!uid || !channel) return;
        if (uid.includes('session')) {
            relatedSessionId = uid.substr(8);
            entityId = getEntityFromSessionId(relatedSessionId);
            const clientSocketData = getClientSocketDataBySessionId(entityId, relatedSessionId);
            if (clientSocketData) {
                clientSocketData.socket.emit('call-started', {});
                if (clientSocketData.session) clientSocketData.session.callUrl = location;
            }

            const observersSocketsData = getObserversSocketsData(entityId);
            const totalObservers = observersSocketsData.length;
            for (let i = 0; i < totalObservers; i += 1) {
                const observerSocketData = observersSocketsData[i];
                observerSocketData.socket.emit('client-join-call', { sessionId: relatedSessionId, callUrl: location });
            }
        } else if (uid.includes('agent')) {
            relatedUserId = uid.substr(6);
            entityId = getEntityFromUserId(relatedUserId);
            const agentSocketsData = getUserSocketsData(relatedUserId);
            if (agentSocketsData) {
                const totalAgentSocketsData = agentSocketsData.length;
                for (let i = 0; i < totalAgentSocketsData; i += 1) {
                    const agentSocketData = agentSocketsData[i];
                    agentSocketData.socket.emit('call-started', {});
                }
            }
        }
    } else if (appId === CONFIG.COBROWSING_APP_ID) {
        if (!isAgent) {
            const hasAgentsConnected = checkAgentsConnected(entityId);
            if (!hasAgentsConnected && !forceConnection) {
                socket.emit('force-disconnection', {});
                return;
            }

            if (sessionId) {
                const sessionsResponse = await sessionBll.find(entityId, { _id: sessionId });
                [session] = sessionsResponse.sessions;
                if (session) sendRecoveredSession(socket, entityId, sessionId, session);
            }

            if (!session) {
                session = await createSession(entityId, ip);
                sessionId = session._id;
                socket.emit('session-created', session);
            }

            session = await updateSessionLocation(entityId, session, location);
            session.isInTab = true;
            notifyNewConnectionToObservers(entityId, session, uid);
        } else {
            if (userId) {
                const usersResponse = await userBll.find({ _id: userId });
                [user] = usersResponse.users;
                const smartLinkSession = getSmartLinkSession(entityId, user.code);
                if (smartLinkSession) socket.emit('smart-link-connection', { sessionId: smartLinkSession._id });
            }
        }
    }

    sockets.push({
        uid,
        user,
        appId,
        socket,
        userId,
        isAgent,
        session,
        entityId,
        location,
        sessionId,
        id: socket.id,
        relatedUserId,
        forceConnection,
        relatedSessionId,
    });
}

function init(io) {
    io.on('connection', (socket) => {
        socket.on('new-location', (data) => {
            let { location } = data;
            location = parseLocation(location);
            const socketData = getSocketData(socket.id);
            if (!socketData || !socketData.sessionId || !socketData.entityId || !socketData.session) return;
            const { entityId, session, isCobrowsing } = socketData;
            session.isCobrowsing = isCobrowsing;
            updateSessionLocation(entityId, session, location);
            if (!session.locations) session.locations = [];
            session.locations.push(location);
            const observersSocketsData = getObserversSocketsData(entityId);
            const totalObservers = observersSocketsData.length;
            for (let i = 0; i < totalObservers; i += 1) {
                const observerSocketData = observersSocketsData[i];
                observerSocketData.socket.emit('update-session', session);
            }
        });

        socket.on('agent-reconnection', (data) => {
            console.log('--- DEBUG: AGENT RECONNECTION START ---');
            const { sessionId, isCobrowsing, isCobrowsingRequest } = data;
            console.log('1. Params:', { sessionId, isCobrowsing, isCobrowsingRequest });

            const socketData = getSocketData(socket.id);
            if (!socketData) {
                console.log('❌ Error: No se encontraron datos del socket del agente.');
                return;
            }
            const { entityId, user, userId } = socketData;
            console.log('2. Agent Data:', { agentId: socket.id, entityId });

            // Asignamos la sesión al agente (IMPORTANTE)
            socketData.sessionId = sessionId;
            socketData.isCobrowsing = isCobrowsing;
            socketData.isCobrowsingRequest = isCobrowsingRequest;

            // Buscamos al cliente
            const clientSocketData = getClientSocketDataBySessionId(entityId, sessionId);

            if (clientSocketData) {
                console.log('✅ 3. Cliente encontrado:', clientSocketData.id);

                console.log('4. Enviando start-emitting y dom-request al cliente...');
                clientSocketData.socket.emit('start-emitting', {});
                clientSocketData.socket.emit('dom-request', {});

                if (clientSocketData.session) {
                    console.log('5. Enviando client-join-call (Agora)...');
                    clientSocketData.socket.emit('client-join-call', { sessionId, callUrl: clientSocketData.location });
                }
            } else {
                console.log('❌ 3. CRÍTICO: No se encontró socket de cliente para EntityId:', entityId, 'y SessionId:', sessionId);
                console.log('   -> Dump de sockets disponibles:', sockets.map(s => ({ id: s.id, isAgent: s.isAgent, sessId: s.sessionId, entId: s.entityId })));
            }

            const agentCallSocketData = getAgentCallSocketData(userId);
            const searchResult = searchSessions(entityId, user, {}, sessionId);

            socketData.socket.emit('sessions-recovered', searchResult);
            if (agentCallSocketData) socketData.socket.emit('call-started', {});

            const newWatcher = { ...user, isCobrowsingRequest, isCobrowsing };
            const observersSocketsData = getObserversSocketsDataBySessionId(entityId, sessionId);
            const watchers = [newWatcher];
            const totalObservers = observersSocketsData.length;

            console.log(`6. Notificando a ${totalObservers} observadores (incluyendo este agente)`);

            for (let i = 0; i < totalObservers; i += 1) {
                const observerSocketData = observersSocketsData[i];
                if (observerSocketData.id === socketData.id) continue;
                const { user, isCobrowsing, isCobrowsingRequest } = observerSocketData;
                watchers.push({ ...user, isCobrowsing, isCobrowsingRequest });
                observerSocketData.socket.emit('new-watcher', newWatcher);
            }

            socketData.socket.emit('set-watchers', { watchers });
            if (isCobrowsing || isCobrowsingRequest) socketData.socket.emit('set-session-connected', { sessionId });

            console.log('--- DEBUG: AGENT RECONNECTION END ---');
        });

        socket.on('client-session-connected', async (data) => {
            const socketData = getSocketData(socket.id);
            if (!socketData || !socketData.entityId || !socketData.sessionId) return;
            const { entityId, sessionId, session, isCobrowsing } = socketData;
            const deviceInfo = getDeviceInfo(data);
            deviceInfo.language = data.language;
            const sessionParsed = { _id: sessionId, deviceInfo };
            const sessionUpdated = await sessionBll.updateOne(entityId, sessionParsed);
            socketData.session = { ...sessionUpdated, isInTab: !!(session && session.isInTab), isCobrowsing };
            const observersSocketsData = getObserversSocketsData(entityId);
            const totalObservers = observersSocketsData.length;
            for (let i = 0; i < totalObservers; i += 1) {
                const observerSocketData = observersSocketsData[i];
                observerSocketData.socket.emit('update-session', session);
            }
        });

        socket.on('search-sessions', (data) => {
            const socketData = getSocketData(socket.id);
            if (!socketData || !socketData.entityId || !data) return;
            const { entityId, user, sessionId } = socketData;
            const searchResult = searchSessions(entityId, user, data, sessionId);
            socketData.socket.emit('sessions-recovered', searchResult);
        });

        socket.on('visibility-change', (data) => {
            const socketData = getSocketData(socket.id);
            if (!socketData) return;
            const observersSocketsData = getObserversSocketsData(socketData.entityId);
            const totalObservers = observersSocketsData.length;
            const { session, isCobrowsing } = socketData;
            session.isInTab = data.isInTab;
            session.isCobrowsing = isCobrowsing;
            for (let i = 0; i < totalObservers; i += 1) {
                const observerSocketData = observersSocketsData[i];
                observerSocketData.socket.emit('update-session', session);
            }
        });

        socket.on('help-pin-request', (data) => {
            const socketData = getSocketData(socket.id);
            if (!socketData || !socketData.entityId || !socketData.session || !data || !data.pin) return;
            socketData.forceConnection = true;
            const { entityId, session, isCobrowsing } = socketData;
            const { pin } = data;
            session.pin = pin;
            session.isCobrowsing = isCobrowsing;
            const sessionParsed = { _id: session._id, pin };
            sessionBll.updateOne(entityId, sessionParsed);
            const observersSocketsData = getObserversSocketsData(entityId);
            const totalObservers = observersSocketsData.length;
            for (let i = 0; i < totalObservers; i += 1) {
                const observerSocketData = observersSocketsData[i];
                observerSocketData.socket.emit('update-session', session);
            }
        });

        socket.on('help-request', () => {
            const socketData = getSocketData(socket.id);
            if (!socketData) return;
            const observersSocketsData = getObserversSocketsData(socketData.entityId);
            const totalObservers = observersSocketsData.length;
            const { session, isCobrowsing } = socketData;
            session.isHelpRequest = true;
            session.isCobrowsing = isCobrowsing;
            for (let i = 0; i < totalObservers; i += 1) {
                const observerSocketData = observersSocketsData[i];
                observerSocketData.socket.emit('update-session', session);
                observerSocketData.socket.emit('help-requested', { sessionId: socketData.sessionId });
            }
        });

        socket.on('custom-flow-triggered', () => {
            const socketData = getSocketData(socket.id);
            if (!socketData) return;
            socketData.forceConnection = true;
            const observersSocketsData = getObserversSocketsData(socketData.entityId);
            const totalObservers = observersSocketsData.length;
            const { session, isCobrowsing } = socketData;
            session.isCustomFlowTriggered = true;
            session.isCobrowsing = isCobrowsing;
            for (let i = 0; i < totalObservers; i += 1) {
                const observerSocketData = observersSocketsData[i];
                observerSocketData.socket.emit('update-session', session);
                observerSocketData.socket.emit('custom-trigger', { sessionId: socketData.sessionId });
            }
        });

        socket.on('watch-session', (data) => {
            const { sessionId } = data;
            const socketData = getSocketData(socket.id);
            if (!socketData || !sessionId) return;
            const clientSocketData = getClientSocketDataBySessionId(socketData.entityId, sessionId);
            if (!clientSocketData) {
                socketData.socket.emit('session-not-found', { sessionId });
                return;
            }

            const observersSocketsData = getObserversSocketsDataBySessionId(socketData.entityId, sessionId);
            if (!observersSocketsData.length) clientSocketData.socket.emit('start-emitting', {});
            socketData.sessionId = sessionId;
            socketData.socket.emit('session-connected', { sessionId });
            if (!socketData.user) return;
            const newWatcher = { ...socketData.user, isCobrowsingRequest: false, isCobrowsing: false };
            const watchers = [newWatcher];
            const totalObservers = observersSocketsData.length;
            for (let i = 0; i < totalObservers; i += 1) {
                const observerSocketData = observersSocketsData[i];
                if (observerSocketData.id === socketData.id) continue;
                const { user, isCobrowsing, isCobrowsingRequest } = observerSocketData;
                watchers.push({ ...user, isCobrowsing, isCobrowsingRequest });
                observerSocketData.socket.emit('new-watcher', newWatcher);
            }

            socketData.socket.emit('set-watchers', { watchers });
            clientSocketData.socket.emit('dom-request', {});
        });

        socket.on('update-session-client', (data) => {
            const { sessionId, clientName } = data;
            const socketData = getSocketData(socket.id);
            if (!socketData || !sessionId) return;
            const clientSocketData = getClientSocketDataBySessionId(socketData.entityId, sessionId);
            if (!clientSocketData || !clientSocketData.entityId) return;
            const { entityId, session, isCobrowsing } = clientSocketData;
            session.clientName = clientName;
            session.isCobrowsing = isCobrowsing;
            const sessionParsed = { _id: sessionId, clientName };
            sessionBll.updateOne(entityId, sessionParsed);
            const observersSocketsData = getObserversSocketsData(entityId);
            const totalObservers = observersSocketsData.length;
            for (let i = 0; i < totalObservers; i += 1) {
                const observerSocketData = observersSocketsData[i];
                observerSocketData.socket.emit('update-session', session);
            }
        });

        socket.on('client-initialize', (data) => {
            const { metadata } = data;
            const clientSocketData = getSocketData(socket.id);
            if (!clientSocketData || !clientSocketData.sessionId || !clientSocketData.entityId) return;
            const { entityId, session, isCobrowsing } = clientSocketData;
            let newMetadata = session.metadata ? session.metadata : {};
            newMetadata = { ...newMetadata, ...metadata };
            session.metadata = newMetadata;
            session.isCobrowsing = isCobrowsing;
            const sessionId = session._id;
            const sessionParsed = { _id: sessionId, metadata };
            if (!session.clientName && metadata.fullName) {
                session.clientName = metadata.fullName;
                sessionParsed.clientName = metadata.fullName;
            }

            sessionBll.updateOne(entityId, sessionParsed);
            const observersSocketsData = getObserversSocketsData(entityId);
            for (let i = 0; i < observersSocketsData.length; i += 1) {
                const observerSocketData = observersSocketsData[i];
                observerSocketData.socket.emit('update-session', session);
            }
        });

        socket.on('stop-watching', (data) => {
            const { sessionId } = data;
            const socketData = getSocketData(socket.id);
            let wasCobrowsing = false;
            let wasCobrowsingRequest = false;
            if (socketData) {
                wasCobrowsing = socketData.isCobrowsing;
                wasCobrowsingRequest = socketData.isCobrowsingRequest;
                socketData.sessionId = '';
                socketData.isCobrowsing = false;
                socketData.isCobrowsingRequest = false;
                if (wasCobrowsing) socketData.socket.emit('set-session-disconnected', {});
            }

            if (!sessionId) return;
            const observersSocketsData = getObserversSocketsDataBySessionId(socketData.entityId, sessionId);
            const clientSocketData = getClientSocketDataBySessionId(socketData.entityId, sessionId);
            if (clientSocketData) {
                const hasCobrowsing = observersSocketsData.some(o => o.isCobrowsing);
                if (wasCobrowsing) {
                    clientSocketData.socket.emit('agent-left', { userId: socketData.userId });
                    if (!hasCobrowsing) clientSocketData.socket.emit('co-browsing-stopped', {});
                }

                if (wasCobrowsingRequest) clientSocketData.socket.emit('stop-co-browsing-request', socketData.user);
                if (!observersSocketsData.length) clientSocketData.socket.emit('stop-emitting', {});
            }

            if (!socketData || !socketData.user) return;
            const userId = socketData.user._id;
            const totalObservers = observersSocketsData.length;
            for (let i = 0; i < totalObservers; i += 1) {
                const observerSocketData = observersSocketsData[i];
                observerSocketData.socket.emit('remove-watcher', { userId });
            }
        });

        socket.on('request-co-browsing', () => {
            const socketData = getSocketData(socket.id);
            if (!socketData) return;
            const { sessionId, entityId } = socketData;
            const observersSocketsData = getObserversSocketsDataBySessionId(entityId, sessionId);
            if (observersSocketsData.some(o => o.isCobrowsingRequest)) {
                socketData.socket.emit('on-going-co-browsing-request', {});
                return;
            } else if (observersSocketsData.some(o => o.isCobrowsing)) {
                socketData.socket.emit('on-going-co-browsing', {});
                return;
            }

            socketData.isCobrowsing = false;
            socketData.isCobrowsingRequest = true;
            socketData.socket.emit('set-session-connected', { sessionId });
            const clientSocketData = getClientSocketDataBySessionId(entityId, sessionId);
            if (!clientSocketData || !socketData.user) return;
            clientSocketData.socket.emit('agent-co-browsing-request', socketData.user);
            const user = { ...socketData.user, isCobrowsingRequest: true, isCobrowsing: false };
            const totalObservers = observersSocketsData.length;
            for (let i = 0; i < totalObservers; i += 1) {
                const observerSocketData = observersSocketsData[i];
                observerSocketData.socket.emit('update-watcher', user);
            }
        });

        socket.on('client-co-browsing-response', (data) => {
            const { userId, isAccepted } = data;
            if (!userId) return;
            const socketData = getSocketData(socket.id);
            if (!socketData) return;
            const { session, entityId, sessionId } = socketData;
            const agentSocketData = getRequestingCoBrowsingSocketData(userId, sessionId);
            if (!agentSocketData) {
                if (isAccepted) socketData.socket.emit('stop-co-browsing', {});
                return;
            }

            session.isHelpRequest = false;
            session.isCobrowsing = isAccepted;
            session.isCustomFlowTriggered = false;
            if (!isAccepted) agentSocketData.socket.emit('set-session-disconnected', {});
            else {
                const newCoBrowsingInfo = setStartCoBrowsingInfo(entityId, session);
                session.coBrowsingInfo = newCoBrowsingInfo;
            }

            agentSocketData.isCobrowsing = isAccepted;
            agentSocketData.isCobrowsingRequest = false;
            agentSocketData.socket.emit('co-browsing-response', { isAccepted });
            if (!agentSocketData.user) return;
            const user = { ...agentSocketData.user, isCobrowsingRequest: false, isCobrowsing: isAccepted };
            const sessionObserversSocketsData = getObserversSocketsDataBySessionId(entityId, sessionId);
            const totalSessions = sessionObserversSocketsData.length;
            for (let i = 0; i < totalSessions; i += 1) {
                const sessionObserverSocketData = sessionObserversSocketsData[i];
                sessionObserverSocketData.socket.emit('update-watcher', user);
            }

            const observersSocketsData = getObserversSocketsData(entityId);
            const totalObservers = observersSocketsData.length;
            for (let i = 0; i < totalObservers; i += 1) {
                const observerSocketData = observersSocketsData[i];
                observerSocketData.socket.emit('update-session', session);
            }
        });

        socket.on('client-stop-co-browsing', () => {
            const socketData = getSocketData(socket.id);
            if (!socketData || !socketData.sessionId) return;
            const { entityId, sessionId, session } = socketData;
            const newCoBrowsingInfo = setEndCobrowsingInfo(entityId, session);
            session.coBrowsingInfo = newCoBrowsingInfo;
            session.userCode = null;
            const observersSocketsData = getObserversSocketsDataBySessionId(entityId, sessionId);
            const coBrowsingSocketData = observersSocketsData.filter(o => o.isCobrowsing);
            const totalCobrowsingUsers = coBrowsingSocketData.length;
            const totalObservers = observersSocketsData.length;
            for (let i = 0; i < totalObservers; i += 1) {
                const observerSocketData = observersSocketsData[i];
                observerSocketData.socket.emit('co-browsing-stopped', {});
                observerSocketData.socket.emit('set-session-disconnected', {});
                observerSocketData.socket.emit('update-session', session);
                observerSocketData.isCobrowsing = false;
                observerSocketData.isCobrowsingRequest = false;
                for (let j = 0; j < totalCobrowsingUsers; j += 1) {
                    const coBrowsingUser = coBrowsingSocketData[j].user;
                    coBrowsingUser.isCobrowsing = false;
                    coBrowsingUser.isCobrowsingRequest = false;
                    observerSocketData.socket.emit('update-watcher', coBrowsingUser);
                }
            }
        });

        socket.on('agent-stop-co-browsing-request', () => {
            const socketData = getSocketData(socket.id);
            if (!socketData || !socketData.sessionId || !socketData.isCobrowsingRequest) return;
            const { entityId, sessionId, user } = socketData;
            user.isCobrowsing = false;
            user.isCobrowsingRequest = false;
            socketData.isCobrowsingRequest = false;
            socketData.socket.emit('co-browsing-request-stopped', {});
            socketData.socket.emit('set-session-disconnected', {});
            const clientSocketData = getClientSocketDataBySessionId(entityId, sessionId);
            if (!clientSocketData) return;
            clientSocketData.socket.emit('stop-co-browsing-request', user);
            const observersSocketsData = getObserversSocketsDataBySessionId(entityId, sessionId);
            const totalObservers = observersSocketsData.length;
            for (let i = 0; i < totalObservers; i += 1) {
                const observerSocketData = observersSocketsData[i];
                observerSocketData.socket.emit('update-watcher', user);
            }
        });

        socket.on('agent-stop-co-browsing', () => {
            const socketData = getSocketData(socket.id);
            if (!socketData || !socketData.sessionId || !socketData.isCobrowsing) return;
            agentStopCoBrowsing(socketData);
        });

        socket.on('dom-change', (data) => {
            const socketData = getSocketData(socket.id);
            if (!socketData || !socketData.sessionId) return;
            const observersSocketsData = getObserversSocketsDataBySessionId(socketData.entityId, socketData.sessionId);
            const totalObservers = observersSocketsData.length;
            for (let i = 0; i < totalObservers; i += 1) {
                const observerSocketData = observersSocketsData[i];
                observerSocketData.socket.emit('update-dom', data);
            }
        });

        socket.on('new-mutations', (data) => {
            const socketData = getSocketData(socket.id);
            if (!socketData || !socketData.sessionId) return;
            const observersSocketsData = getObserversSocketsDataBySessionId(socketData.entityId, socketData.sessionId);
            const totalObservers = observersSocketsData.length;
            for (let i = 0; i < totalObservers; i += 1) {
                const observerSocketData = observersSocketsData[i];
                observerSocketData.socket.emit('dom-mutations', data);
            }
        });

        socket.on('window-resize', (data) => {
            const socketData = getSocketData(socket.id);
            if (!socketData || !socketData.sessionId) return;
            const observersSocketsData = getObserversSocketsDataBySessionId(socketData.entityId, socketData.sessionId);
            const totalObservers = observersSocketsData.length;
            for (let i = 0; i < totalObservers; i += 1) {
                const observerSocketData = observersSocketsData[i];
                observerSocketData.socket.emit('resize', data);
            }
        });

        socket.on('new-agent-event', (data) => {
            const socketData = getSocketData(socket.id);
            if (!socketData || !socketData.sessionId) return;
            const sessionSocketsData = getSessionSockets(socketData.entityId, socketData.sessionId);
            const totalSessions = sessionSocketsData.length;
            for (let i = 0; i < totalSessions; i += 1) {
                const sessionSocketData = sessionSocketsData[i];
                if (sessionSocketData.id === socketData.id) continue;
                const dataParsed = { ...data, user: socketData.user };
                sessionSocketData.socket.emit('agent-event', dataParsed);
            }
        });

        socket.on('new-client-event', (data) => {
            const socketData = getSocketData(socket.id);
            if (!socketData || !socketData.sessionId) return;
            const observersSocketsData = getObserversSocketsDataBySessionId(socketData.entityId, socketData.sessionId);
            const totalObservers = observersSocketsData.length;
            for (let i = 0; i < totalObservers; i += 1) {
                const observerSocketData = observersSocketsData[i];
                observerSocketData.socket.emit('client-event', data);
            }
        });

        socket.on('smart-link-access', (data) => {
            const socketData = getSocketData(socket.id);
            if (!socketData || !socketData.sessionId || !socketData.entityId || !data || !data.code) return;
            const { code } = data;
            socketData.session.userCode = code;
            const observerSocketData = getObserverSocketDataByCode(socketData.entityId, code);
            if (!observerSocketData) return;
            observerSocketData.socket.emit('smart-link-connection', { sessionId: socketData.sessionId });
            observerSocketData.socket.emit('update-session', socketData.session);
        });

        socket.on('get-smart-link-session', (data) => {
            const socketData = getSocketData(socket.id);
            if (!socketData || !data || !data.sessionId) return;
            const { sessionId } = data;
            const clientSocketData = getClientSocketDataBySessionId(socketData.entityId, sessionId);
            if (!clientSocketData) return;
            socketData.socket.emit('smart-link-session', { session: clientSocketData.session });
        });

        socket.on('widget-availability-change', (data) => {
            const socketData = getSocketData(socket.id);
            if (!socketData || !data || !data.entityId) return;
            const { entityId, isWidgetEnabled } = data;
            const clientsSocketsData = getClientsSocketsData(entityId);
            const totalClients = clientsSocketsData.length;
            for (let i = 0; i < totalClients; i += 1) {
                const clientSocketData = clientsSocketsData[i];
                clientSocketData.socket.emit('set-widget-availability', { isWidgetEnabled });
            }
        });

        socket.on('smart-link-response', (data) => {
            const socketData = getSocketData(socket.id);
            if (!socketData || !socketData.entityId || !data || !data.sessionId) return;
            const { sessionId, isBusy } = data;
            const { entityId } = socketData;
            const clientSocketData = getClientSocketDataBySessionId(entityId, sessionId);
            if (!clientSocketData) return;
            clientSocketData.smartLinkResponded = true;
            clientSocketData.socket.emit('smart-link-agent-response', { isBusy });
        });

        socket.on('request-join-call', () => {
            const socketData = getSocketData(socket.id);
            if (!socketData || !socketData.entityId || !socketData.user || !socketData.user.code) return;
            const { sessionId, entityId, user } = socketData;
            const clientSocketData = getClientSocketDataBySessionId(entityId, sessionId);
            if (!clientSocketData) return;
            const { name, code } = user;
            clientSocketData.socket.emit('agent-request-call', { name, code });
        });

        socket.on('request-device-info', (data) => {
            const socketData = getSocketData(socket.id);
            if (!socketData) return;
            const userData = {};
            const { entityId, relatedUserId } = socketData;
            if (relatedUserId) {
                const agentSocketData = getAgentSocketDataByUserId(entityId, relatedUserId);
                if (agentSocketData) {
                    const { name, lastName, avatarUrl } = agentSocketData.user;
                    userData.name = name;
                    userData.avatarUrl = avatarUrl;
                    if (lastName) userData.name += ` ${lastName}`;
                }
            }

            const deviceInfo = getDeviceInfo(data);
            const responseData = { userData, deviceInfo };
            socketData.socket.emit('device-info-response', responseData);
        });

        socket.on('call-user-data-request', (data) => {
            const socketData = getSocketData(socket.id);
            if (!socketData) return;
            const { entityId } = socketData;
            const { uid } = data;
            const userData = { id: `user-${uid}`, name: 'Unknown' };
            if (uid.includes('session')) {
                const relatedSessionId = uid.substr(8);
                const clientSocketData = getClientSocketDataBySessionId(entityId, relatedSessionId);
                if (clientSocketData && clientSocketData.session) {
                    const { session } = clientSocketData;
                    if (session.clientName) userData.name = session.clientName;
                }
            } else if (uid.includes('agent')) {
                const relatedUserId = uid.substr(6);
                const agentSocketsData = getUserSocketsData(relatedUserId);
                if (agentSocketsData && agentSocketsData.length) {
                    const user = agentSocketsData[0].user;
                    userData.name = user.name;
                    userData.avatarUrl = user.avatarUrl;
                    if (user.lastName) userData.name += ` ${user.lastName}`;
                }
            }

            socketData.socket.emit('call-user-data-response', userData);
        });

        socket.on('client-end-call-request', () => {
            const socketData = getSocketData(socket.id);
            if (!socketData || !socketData.sessionId) return;
            const callSocketData = getClientCallSocketData(socketData.sessionId);
            if (!callSocketData) return;
            callSocketData.socket.emit('end-call-request', {});
        });

        socket.on('agent-end-call-request', () => {
            const socketData = getSocketData(socket.id);
            if (!socketData || !socketData.userId) return;
            const callSocketData = getAgentCallSocketData(socketData.userId);
            if (!callSocketData) socketData.socket.emit('call-ended', {});
            else callSocketData.socket.emit('end-call-request', {});
        });

        socket.on('agent-logout', () => {
            const socketData = getSocketData(socket.id);
            if (!socketData || !socketData.userId) return;
            forceLogout(socketData.userId);
        });

        socket.onAny(() => {
            if (socket.connectionTimeOut) clearTimeout(socket.connectionTimeOut);
            const forceConnection = socket.handshake.query.force === 'true';
            if (!inactiveTime || forceConnection) return;
            socket.connectionTimeOut = setTimeout(() => {
                socket.emit('force-disconnection', {});
            }, inactiveTime);
        });

        socket.on('disconnect', () => {
            const socketData = getSocketData(socket.id);
            if (!socketData) return;
            if (socketData.appId && socketData.appId === CONFIG.AGORA_APP_ID) handleCallDisconnection(socketData);
            removeSocket(socketData.id);
            if (socketData.isAgent) handleAgentDisconnection(socketData);
            else notifyRemoveConnectionToObservers(socketData.entityId, socketData.session);
        });

        socket.on('test-emit', (data) => {
            socket.emit('test-emit-back', data);
        });

        const forceConnection = socket.handshake.query.force === 'true';
        if (!forceConnection && maxSocketConnections && maxSocketConnections <= sockets.length) {
            socket.emit('force-disconnection', {});
            return;
        }

        handleNewSocket(socket, forceConnection);
    });
}

initializeValidators();

module.exports = {
    init,
    forceLogout,
    getConnections,
    setMaxConnections,
    checkUserConnection,
    setSocketInactivityTime,
    setConnectionWithoutAgentsValidation,
};
