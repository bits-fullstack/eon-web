import { put, takeLatest } from "redux-saga/effects";

import { APIService, requestURLS } from "../constants/APIConstant";
import {message} from "antd";
import { actionEventTypes, actionSubscription } from "../constants/actionTypes";
import {checkResponse,ifAccessTokenExpired} from "../actions/commonActions";

/**
 * create new event
 * @param {accessToken, event data, eventId in case of update, callback method} param
 * accessToken for authorisation
 * data to post event data
 * eventId to hit patch in case of update event
 * callback: callback method to execute on succesfull post/patch
 */
export function* createNewEvent(param) {
  let { data, callback, eventId, accessToken } = param;
  if(ifAccessTokenExpired(accessToken)){
    return;
  }
  try {
    yield put({ type: actionEventTypes.SET_EVENT_FETCHING });
    const method = eventId ? "PATCH" : "POST";
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
    let imageUploadResponse = {};
    // to upload image
    if (data.imageFile && data.imageFile.name) {
      let responseImage = {};
      let getPresignedUrl = APIService.dev + requestURLS.UPLOAD_IMAGE;

      imageUploadResponse = yield fetch(getPresignedUrl, {
        headers: headers,
        method: "POST",
        body: JSON.stringify({
          path_name: data.imageFile.name,
        }),
      }).then((response) => {
        responseImage = response;
        return response.json();
      });

      checkResponse(responseImage, imageUploadResponse);
      
      yield fetch(imageUploadResponse.data.presigned_url, {
        method: "PUT",
        body: data.imageFile,
      }).then((response) => {
        responseImage = response;
      });

      checkResponse(responseImage,{message:"Something went wrong"});
    }

    let postURL = "";
    if (!eventId) {
      postURL = APIService.dev + requestURLS.EVENT_OPERATIONS;
    } else
      postURL = APIService.dev + requestURLS.EVENT_OPERATIONS + `${eventId}/`;
      let {name, external_links, location, date, time, subscription_fee, event_type, no_of_tickets, description, event_created_by} =data;
      let sendData = {name, external_links, location, date, time, subscription_fee, event_type, no_of_tickets, description, event_created_by};
      if(data.imageFile.name){
        sendData.images = imageUploadResponse.data?imageUploadResponse.data.image_name:""||"";
      }
    
    let recievedResponse = {};
    let responseJson = yield fetch(postURL, {
      headers: headers,
      method: method,
      body: JSON.stringify(sendData),
    }).then((response) => {
      recievedResponse = response;
      return response.json();
    });
    checkResponse(recievedResponse, responseJson);

    if (eventId) {
      let getURL =
        APIService.dev + requestURLS.EVENT_OPERATIONS + `${eventId}/`;
      responseJson = yield fetch(getURL, {
        headers: headers,
        method: "GET",
      }).then((response) => {
        recievedResponse = response;
        return response.json();
      });

      checkResponse(recievedResponse, responseJson);
      yield put({
        type: actionEventTypes.RECEIVED_EVENT_DATA,
        payload: responseJson.data,
      });
      callback({ id: responseJson.data.id });
    } else {
      yield put({
        type: actionEventTypes.RECEIVED_EVENT_DATA,
        payload: responseJson,
      });
      callback({ id: responseJson.id });
    }
  } catch (e) {
    console.error(e);
    yield put({
      type: actionEventTypes.EVENT_ERROR,
      error: e,
    });
    callback({ error: e.message });
  }
}

/**
 * fetch events list
 * @param {accessToken, filterData} param
 * accessToken for authorisation
 * filterData different filters to apply while fetching events list
 */
export function* fetchEventsList(param) {
  const { accessToken, filterData } = param;
  if(ifAccessTokenExpired(accessToken)){
    return;
  }
  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };
  
let params = {};
if(filterData.type && filterData.type !== 'All'){
  params = {...params, event_type:filterData.type}
}
if(filterData.event_status){
  params = {...params, event_status : filterData.event_status}
}

if(filterData.subscription_type && filterData.subscription_type !== 'All'){
  params = {...params, subscription_type : filterData.subscription_type}
}

if(filterData.startDate && filterData.endDate)
  params = {...params, start_date:filterData.startDate,end_date:filterData.endDate}

if(filterData.search)
  params = {...params, search: filterData.search}

if(filterData.event_created_by)
  params = {...params, event_created_by: filterData.event_created_by}

if(filterData.is_wishlisted)
  params = {...params, is_wishlisted:filterData.is_wishlisted}

  try {
    yield put({ type: actionEventTypes.SET_EVENT_FETCHING });
    let getURL = APIService.dev + requestURLS.EVENT_OPERATIONS;
    getURL = Object.keys(params).reduce((accu, current, index) => {
      const prefix = index === 0 ? '?' : '&';
      return accu + prefix + current + '=' + params[current];
  }, getURL);
    let responseObject = {};
    const responseJson = yield fetch(getURL, {
      headers: headers,
      method: "GET",
    }).then((response) => {
      responseObject = response;
      return response.json();
    });

    checkResponse(responseObject, responseJson);

    yield put({
      type: actionEventTypes.RECEIVED_EVENT_LIST,
      payload: responseJson.data,
    });

    yield put({type: actionEventTypes.SET_EVENT_UPDATE, payload: false});
  } catch (e) {
    console.error(e);
    yield put({ type: actionEventTypes.EVENT_ERROR, error: e });
  }
}

/**
 * fetcch event details
 * @param {accessToken, eventId, callback method} param
 * accessToken for authorisation
 * data to post event data
 * eventId to hit patch in case of update event
 * callback: callback method 
 */
export function* fetchEventData(param) {
  const { eventId, accessToken, callback, ifUpdate } = param;
  if(ifAccessTokenExpired(accessToken)){
    return;
  }
  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };
  try {
    yield put({ type: actionEventTypes.SET_EVENT_FETCHING });
    const getURL =
      APIService.dev + requestURLS.EVENT_OPERATIONS + `${eventId}/`;
    let responseObject = {};
    const responseJson = yield fetch(getURL, {
      headers: headers,
      method: "GET",
    }).then((response) => {
      responseObject = response;
      return response.json();
    });

    checkResponse(responseObject, responseJson);

    yield put({
      type: actionEventTypes.RECEIVED_EVENT_DATA,
      payload:responseJson.data,
    });

    if(ifUpdate){
      yield put({type: actionEventTypes.SET_EVENT_UPDATE, payload:true})
    }
    callback();
  } catch (e) {
    console.error(e);
    yield put({ type: actionEventTypes.EVENT_ERROR, error: e });
    callback(e.message);
  }
}

/**
 * delete/ cancel event
 * @param {accessToken, eventId, message, callback method} param
 * accessToken for authorisation
 * eventId which event to cancel
 * message: message for the subscribers who are alread subscribed
 * callback: callback method 
 */
export function* deleteEvent(param) {
  const {message, accessToken, eventId, callback} = param;
  if(ifAccessTokenExpired(accessToken)){
    return;
  }
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  try{
    yield put({type:actionEventTypes.SET_EVENT_FETCHING});

    const deleteURL = APIService.dev+requestURLS.EVENT_OPERATIONS+`${eventId}/`;
    let responseObject = {};
    let responseJSON = yield fetch(deleteURL,{
      headers: headers,
      method: "DELETE",
      body: JSON.stringify({message:message})
    }).then(response => {
      responseObject = response;
      return response.json();
    });

    checkResponse(responseObject,responseJSON);

    callback();
  }catch(e) {
    console.error(e);
    yield put({ type: actionEventTypes.EVENT_ERROR, error: e });
    callback(e.message);
  }
}

/**
 * add invitees to event
 * @param {accessToken, event data, updateType} param
 * accessToken for authorisation
 * data : event data 
 * eventId to hit patch in case of update event
 * callback: callback method 
 */
export function* saveInvitees(param) {
  const { accessToken, data, updateType } = param;
  if(ifAccessTokenExpired(accessToken)){
    return;
  }
  const eventId = data.event;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
  try {
    yield put({ type: actionEventTypes.SET_EVENT_FETCHING });
    let getURL = APIService.dev + requestURLS.INVITEE_LIST;
    let responseObject = {};
    let responseJson = {};
    if (updateType === "save") {
      responseJson = yield fetch(getURL, {
        headers: headers,
        method: "POST",
        body: JSON.stringify(data),
      }).then((response) => {
        responseObject = response;
        return response.json();
      });
      checkResponse(responseObject, responseJson);
    } else {
      data.event_id = data.event;
      delete data.event;
      yield fetch(getURL, {
        headers: headers,
        method: "DELETE",
        body: JSON.stringify(data),
      }).then((response) => {
        responseObject = response;
      });
      checkResponse(responseObject, { message: "Something went wrong" });
    }

    getURL = APIService.dev + requestURLS.EVENT_OPERATIONS + `${eventId}/`;
    responseJson = yield fetch(getURL, {
      headers: headers,
      method: "GET",
    }).then((response) => {
      responseObject = response;
      return response.json();
    });

    checkResponse(responseObject, responseJson);

    yield put({
      type: actionEventTypes.RECEIVED_EVENT_DATA,
      payload: responseJson.data,
    });
  } catch (e) {
    console.error(e);
    yield put({ type: actionEventTypes.EVENT_ERROR, error: e });
  }
}
/**
 * notify subscribers with message
 * @param {data,accessToken} param 
 * data: message to share
 * accessToken: access token for authorization
 */
export function* notifyUsers(param){
  const {data, accessToken} =param;
  if(ifAccessTokenExpired(accessToken)){
    return;
  }
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
  try{
    yield put({type:actionEventTypes.SET_EVENT_FETCHING});

    const postURL = APIService.dev+requestURLS.NOTIFY_SUBSCRIBER;
    let responseObject = {};
    let responseJSON = yield fetch(postURL,{
      headers: headers,
      method: "POST",
      body: JSON.stringify(data),
    }).then(response=> {
      responseObject = response;
      return response.json();
    });

    checkResponse(responseObject,responseJSON);

    yield put({type: actionEventTypes.SET_EVENT_FETCHING});

    message.success(responseJSON.message);
  } catch (e) {
    console.error(e);
    yield put({type: actionEventTypes.EVENT_ERROR, error: e});
    message.error(e.message);
  }
}

/**
 * subscribe  free events
 * @param {accessToken, event data, callback method} param
 * accessToken for authorisation
 * data: event data
 * callback: callback method
 */
export function* subscribeFreeEvent(param){
  const {data, accessToken, callback } = param;
  if(ifAccessTokenExpired(accessToken)){
    return;
  }
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`
  }
  try{
    yield put({type: actionEventTypes.SET_EVENT_FETCHING});
    let postUrl  = APIService.dev+requestURLS.SUBSCRIPTION;
    let responseObject = {};
    let responseJson = yield fetch(postUrl,{
      headers: headers,
      method: "POST",
      body: JSON.stringify(data)
    }).then(response => {
      responseObject = response;
      return response.json();
    })

    checkResponse(responseObject,responseJson);

    let responseMessage = responseJson.message;

    let getURL = APIService.dev + requestURLS.EVENT_OPERATIONS + `${data.event_id}/`;
    responseJson = yield fetch(getURL, {
      headers: headers,
      method: "GET",
    }).then((response) => {
      responseObject = response;
      return response.json();
    });

    checkResponse(responseObject, responseJson);

    yield put({
      type: actionEventTypes.RECEIVED_EVENT_DATA,
      payload: responseJson.data,
    });

    callback();
    message.success(responseMessage);
  }catch (e) {
    console.error(e);
    yield put({type: actionEventTypes.EVENT_ERROR, error: e});
    callback(e.message);
  }
}

/**
 * subcription for paid events
 * @param {accessToken, event data,  callback method} param
 * accessToken for authorisation
 * data: event data
 * callback: callback method 
 */
export function* paidSubscription(param){
  const {data, accessToken, callback} = param;
  if(ifAccessTokenExpired(accessToken)){
    return;
  }
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`
  }
  try{
    yield put({type: actionEventTypes.SET_EVENT_FETCHING});

    let postURL = APIService.dev+requestURLS.SUBSCRIPTION;
    let responseObject = {};
    let responseJson = yield fetch(postURL, {
      headers : headers,
      method: "POST",
      body: JSON.stringify(data)
    }).then(response => {
      responseObject = response;
      return response.json();
    });

    checkResponse(responseObject, responseJson);
    let responseMessage = responseJson.message;

    let getURL = APIService.dev + requestURLS.EVENT_OPERATIONS + `${data.event_id}/`;
    responseJson = yield fetch(getURL, {
      headers: headers,
      method: "GET",
    }).then((response) => {
      responseObject = response;
      return response.json();
    });

    checkResponse(responseObject, responseJson);

    yield put({
      type: actionEventTypes.RECEIVED_EVENT_DATA,
      payload: responseJson.data,
    });

    callback();
    message.success(responseMessage);

  } catch (e) {
    console.error(e);
    yield put({type: actionEventTypes.EVENT_ERROR, error: e});
    callback(e.message);
    message.error(e.message);
  }
}

/**
 *  cancel subcription for events
 * @param {accessToken, event id} param
 * accessToken for authorisation
 * eventId: event id
 */
export function* cancelSubscription(param) {
  const {eventId, accessToken} =param;
  if(ifAccessTokenExpired(accessToken)){
    return;
  }
  const headers = {
    Authorization: `Bearer ${accessToken}`
  }
  try{
    yield put({type: actionEventTypes.SET_EVENT_FETCHING});

    let deleteURL = APIService.dev + requestURLS.SUBSCRIPTION+`${eventId}`;
    let responseObject = {};
    let responseJSON = yield fetch(deleteURL, {
      headers: headers,
      method: "DELETE",
    }).then(response => {
      responseObject = response;
      return response.json();
    })
    checkResponse(responseObject, responseJSON);
    let responseMessage = responseJSON.message;

    let getURL = APIService.dev + requestURLS.EVENT_OPERATIONS + `${eventId}/`;
    responseJSON = yield fetch(getURL, {
      headers: headers,
      method: "GET",
    }).then((response) => {
      responseObject = response;
      return response.json();
    });

    checkResponse(responseObject, responseJSON);

    yield put({
      type: actionEventTypes.RECEIVED_EVENT_DATA,
      payload: responseJSON.data,
    });
    message.success(responseMessage);
  } catch (e) {
    console.error(e);
    yield put({type: actionEventTypes.EVENT_ERROR, error: e});
    message.error(e.message);
  }
}

/**
 * share event s with friends
 * @param {accessToken,data} param
 * accessToken for authorisation
 * data: mesage to share
 */
export function* shareWithFriendPost(param) {
  const {data, accessToken } = param;
  if(ifAccessTokenExpired(accessToken)){
    return;
  }
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`
  }
  try{
    yield put({type: actionEventTypes.SET_EVENT_FETCHING});

    let postURL = APIService.dev+requestURLS.SHARE_FRIEND;
    let responseObject = {};
    let responseJSON = yield fetch(postURL,{
      headers: headers,
      method: "POST",
      body: JSON.stringify(data)
    }).then(response => {
      responseObject = response;
      return response.json();
    })

    checkResponse(responseObject, responseJSON);

    yield put({type: actionEventTypes.SET_EVENT_FETCHING});
    message.success(responseJSON.message);

  } catch (e) {
    console.error(e);
    yield put({type: actionEventTypes.EVENT_ERROR, error: e});
    message.error(e.message);
  }
}

/**
 * upadte wishlist
 * @param {accessToken,  data, uodateType, callback method} param
 * accessToken for authorisation
 * data: event data
 * updateType: remove or add
 * callback: callback method 
 */
export function* updateWishlistUser(param){
  const {data, accessToken, updateType, callback} = param;
  if(ifAccessTokenExpired(accessToken)){
    return;
  }
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`
  }
  try{
    yield put({type: actionEventTypes.SET_EVENT_FETCHING});
    if(updateType === "add"){
      let postUrl = APIService.dev + requestURLS.WISHLIST;
      let responseObject = {};
      let responseJSON = yield fetch(postUrl,{
        headers: headers,
        method: "POST",
        body: JSON.stringify(data)
      }).then(response => {
        responseObject = response;
        return response.json();
      });

      checkResponse(responseObject, responseJSON);

      yield put({type: actionEventTypes.SET_EVENT_FETCHING});
      message.success(responseJSON.message);
    }
    else{
      let deleteUrl = APIService.dev + requestURLS.WISHLIST+`${data.event_id}/`;
      let responseObject = {};
      let responseJSON = yield fetch(deleteUrl, {
        headers: headers,
        method: "DELETE",
      }).then(response => {
        responseObject = response;
        return response.json();
      });

      checkResponse(responseObject, responseJSON);

      yield put({type: actionEventTypes.SET_EVENT_FETCHING});
      message.success(responseJSON.message);
    }
    callback();
  } catch (e) {
    console.error(e);
    yield put({type: actionEventTypes.EVENT_ERROR, error: e});
    message.error(e.message);
  }
}
export function* eventActionWatcher() {
  yield takeLatest(actionEventTypes.CREATE_EVENT, createNewEvent);
  yield takeLatest(actionEventTypes.GET_EVENT_LIST, fetchEventsList);
  yield takeLatest(actionEventTypes.GET_EVENT_DATA, fetchEventData);
  yield takeLatest(actionEventTypes.SAVE_INVITEE, saveInvitees);
  yield takeLatest(actionEventTypes.CANCEL_EVENT, deleteEvent);
  yield takeLatest(actionEventTypes.NOTIFY_SUBSCRIBER, notifyUsers);
  yield takeLatest(actionSubscription.SUBSCRIBE_FREE, subscribeFreeEvent);
  yield takeLatest(actionSubscription.SUBSCRIBE_PAID, paidSubscription);
  yield takeLatest(actionEventTypes.SHARE_WITH_FRIEND, shareWithFriendPost);
  yield takeLatest(actionSubscription.CANCEL_SUBSCRIPTION, cancelSubscription);
  yield takeLatest(actionEventTypes.WISHLIST_UPDATE, updateWishlistUser);
}
