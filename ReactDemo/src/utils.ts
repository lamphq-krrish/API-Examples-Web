const PARAMS = {
  username: "username",
  wbId: "wbId",
  wbPass: "wbPass",
  uid: "uid",
  rtcToken: "rtcToken",
  rtmToken: "rtmToken",
  type: "type",
  role: "role",
  appId: "appId",
};

export function getQueryVariable(arg: string) {
  const query = window.location.search.split("?")[1];
  const vars = query.split("&");
  for (let i = 0; i < vars.length; i++) {
    const pair = vars[i].split("=");
    if (decodeURIComponent(pair[0]) == arg) {
      return decodeURIComponent(pair[1]);
    }
  }
  console.error("Query variable %s not found", arg);
}

export function getUsername() {
  return getQueryVariable(PARAMS.username);
}

export function getWbId() {
  return getQueryVariable(PARAMS.wbId);
}

export function getWbPass() {
  return getQueryVariable(PARAMS.wbPass);
}

export function getUid() {
  return getQueryVariable(PARAMS.uid);
}

export function getRtcToken() {
  return getQueryVariable(PARAMS.rtcToken);
}

export function getRtmToken() {
  return getQueryVariable(PARAMS.rtmToken);
}

export function getType() {
  return getQueryVariable(PARAMS.type);
}

export function getRole() {
  return getQueryVariable(PARAMS.role);
}

export function getAppId() {
  return getQueryVariable(PARAMS.appId);
}