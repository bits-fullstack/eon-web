import { actionLoginTypes, actionNotificationsTypes, actionAnalytics, actionFeedbackTypes } from "../constants/actionTypes";
import * as jwt from 'jsonwebtoken';

export const getUser = ({email,password,callback}) => {
  return {
    type: actionLoginTypes.GET_USER,
    email: email,
    password: password,
    callback: callback
  };
};

export const getNotifications = (access) => {
  return {
    type: actionNotificationsTypes.GET_NOTIFICATIONS,
    access: access
  };
};

export const readNotifications = ({list, access, callback}) => {
  return {
    type: actionNotificationsTypes.READ_NOTIFICATIONS,
    list: list,
    access: access,
    callback: callback
  };
};

export const postUser = ({data,callback}) => {
  return {
    type: actionLoginTypes.POST_USER,
    data: data,
    callback: callback
  }
}
export const getVerificationCode = ({data,callback}) => {
  return {
    type: actionLoginTypes.GET_CODE,
    data: data,
    callback: callback
  }
}

export const postForgotPassword = ({data, callback}) => {
  return {
    type: actionLoginTypes.FORGOT_PASSWORD,
    data: data,
    callback: callback
  }
}
export const postChangePassword = ({data,accessToken, callback}) => {
  return {
    type: actionLoginTypes.CHANGE_PASSWORD,
    data: data,
    accessToken: accessToken,
    callback: callback,
  }
}

export const logOutUser = ({callback}) => {
  return {
    type: actionLoginTypes.LOGGING_OUT,
    callback: callback
  }
}

export const getUserProfile = ({userId, accessToken}) => {
  return {
    type: actionLoginTypes.USER_PROFILE,
    userId, accessToken
  }
}

export const getQuestions = ({accessToken}) => {
  return {
    type: actionFeedbackTypes.QUESTIONS,
    accessToken
  }
}


export const getResponses = ({id, accessToken}) => {
  return {
    type: actionFeedbackTypes.RESPONSES,
    accessToken,
    id
  }
}

export const postResponses = ({eventId, feedback, accessToken, callback}) => {
  return {
    type: actionFeedbackTypes.POST_QUESTIONS,
    event_id: eventId,
    feedback,
    accessToken, 
    callback
  }
}

export const updateUserProfile = ({userId, data, accessToken, callback}) => {
  return {
    type: actionLoginTypes.UPDATE_USER_PROFILE,
    userId,
    data,
    accessToken,
    callback
  }
}

export const fetchAnalyticsData = ({accessToken, filterData}) => {
  return {
    type: actionAnalytics.GET_ANALYTICS,
    accessToken,
    filterData
  }
}

export const checkResponse = (response, responseJson) => {
  if (!response.ok) {
    throw responseJson;
  } else return;
};

export const ifAccessTokenExpired = (token) => {
  var decoded = jwt.decode(token, { complete: true });
  const currentTime = Math.floor(new Date().getTime() / 1000);
  if (decoded && currentTime > decoded.payload.exp) {
    localStorage.clear();
    window.location.replace("/login");
    return true;
  } else return false;
};
