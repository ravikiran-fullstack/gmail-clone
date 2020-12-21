// Client ID and API key from the Developer Console
var CLIENT_ID = "354191623029-inuaug8o7ca6f909t37miohr1hpcf9gu.apps.googleusercontent.com";
var API_KEY = "AIzaSyD4cUbyfOPegLeDAU-TJym-7DwFQrrEOEw";

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/gmail.modify";

var authorizeButton = document.getElementById("authorize_button");
var signOutButton = document.getElementById("signOut_button");

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
  gapi.load("client:auth2", initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
  gapi.client.init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      discoveryDocs: DISCOVERY_DOCS,
      scope: SCOPES,
    })
    .then(
      function () {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSignInStatus);

        // Handle the initial sign-in state.
        updateSignInStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        authorizeButton.onclick = handleAuthClick;
        signOutButton.onclick = handleSignOutClick;
      },
      function (error) {
        appendPre(JSON.stringify(error, null, 2));
      }
    );
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSignInStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.classList.add('hidden');
    signOutButton.classList.remove('hidden');
    document.getElementById("homeContainer").classList.remove('hidden');
    showPrimaryEmails();
   // listLabels();
   // listMessages('github');
  } else {
    authorizeButton.classList.remove('hidden');
    signOutButton.classList.add('hidden');
    document.getElementById("homeContainer").classList.add('hidden');
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignOutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
  var pre = document.getElementById("content");
  var textContent = document.createTextNode(message + "\n");
  pre.appendChild(textContent);
}

/**
 * Print all Labels in the authorized user's inbox. If no labels
 * are found an appropriate message is printed.
 */
function listLabels() {
  gapi.client.gmail.users.labels
    .list({userId: "me"})
    .then(function (response) {
      console.log('labels',response);
      var labels = response.result.labels;
      appendPre("Labels:");

      if (labels && labels.length > 0) {
        for (i = 0; i < labels.length; i++) {
          var label = labels[i];
          appendPre(`${label.name}: ${label.id}`);
        }
      } else {
        appendPre("No Labels found.");
      }
    });
}

function listMessages(query) {
  gapi.client.gmail.users.messages
    .list({
      userId: "me",
      q: query, 
    })
    .then(function (response) {
      console.log('messages', response);
      // var labels = response.result.labels;
      // appendPre("Labels:");

      // if (labels && labels.length > 0) {
      //   for (i = 0; i < labels.length; i++) {
      //     var label = labels[i];
      //     appendPre(`${label.name}: ${label.id}`);
      //   }
      // } else {
      //   appendPre("No Labels found.");
      // }
    });
}

function fetchProfile(){
  gapi.client.request('https://gmail.googleapis.com/gmail/v1/users/me/profile')
    .then(function(userProfileData){
      console.log('Profile ', userProfileData);
      showUserProfileData(userProfileData);
    }).catch(err => console.error('Error while loading Profile',err));
}

function showUserProfileData(userProfileData){
  console.log('UserProfileData', JSON.parse(userProfileData.body).emailAddress);
}

async function fetchIndividualEmails(messageId){
  try{
    const emailData = await gapi.client.request(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`);
    return emailData;
  }catch(err){
    console.error('error while fetching individual email', email);
  }
}

async function fetchAllMessages(category){
  document.getElementById('emailsLoading').classList.remove('hidden');
  try{
    const userEmailsData = await gapi.client.request(`https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=${category}`);
    console.log('Emails ', userEmailsData);
    processIndividualEmailsData(userEmailsData, category);
  }catch(err){
    console.error('Error while loading Emails',err)
  }
}

async function fetchIndividualDrafts(draftId){
  try{
    const draftData = await gapi.client.request(`https://gmail.googleapis.com/gmail/v1/users/me/drafts/${draftId}`);
    return draftData;
  }catch(err){
    console.error('error while fetching individual draft',draft);
  }
}

async function fetchAllDrafts(){
  document.getElementById('emailsLoading').classList.remove('hidden');
  try{
    const userDraftsData = await gapi.client.request(`https://gmail.googleapis.com/gmail/v1/users/me/drafts`);
    console.log('Drafts ', userDraftsData);
    processIndividualDraftsData(userDraftsData, 'DRAFTS');
  }catch(err){
    console.error('Error while loading Drafts',err)
  }
}

async function processIndividualDraftsData(userDraftsData, category){
  console.log(userDraftsData);
  userDraftsArray  = JSON.parse(userDraftsData.body);
  const draftsInfoArray = [];
  Promise.all(
    userDraftsArray.drafts.map( async (draft) => {
      const draftInfo = await fetchIndividualDrafts(draft.id);
      draftsInfoArray.push(draftInfo)
    })
  ).then(() => {
    generateDraftsHtml(draftsInfoArray, category);
  }).catch(err => console.error('err', err));
}

function generateDraftsHtml(draftsInfoArray, category){
  document.getElementById('emailsLoading').classList.add('hidden');
  console.log('generateDraftsHtml', draftsInfoArray);
  let emailTab = 'primaryTab';
  document.getElementById(emailTab).innerHTML = '';
  const draftsTable =  document.createElement('div');
  draftsTable.classList.add('container');
  draftsTable.setAttribute('id', `${emailTab}Table`);
  draftsProcessedData = [];

  draftsInfoArray.map(draft => {
    const draftProcessedData = {};
    const payloadHeaders = draft.result.message.payload.headers;
    payloadHeaders.map(header => {
      if(header.name === 'Date'){
        draftProcessedData.date = header.value;
      } else if (header.name === 'Subject'){
        draftProcessedData.subject = header.value || '(no subject)';
      } else if (header.name === 'From'){
        draftProcessedData.from = 'Draft';
      }
    })
    draftsProcessedData.push(draftProcessedData);
    const tableRow = document.createElement('div');
    tableRow.classList.add('row','emailsCustomRow');
    tableRow.innerHTML = `
                  <div class="col-4 text-truncate">${draftProcessedData.from}</div>
                  <div class="col-4 text-truncate">${draftProcessedData.subject}</div>
                  <div class="col-4 text-truncate">${draftProcessedData.date}</div>
                `;
    draftsTable.append(tableRow);
  })
  document.getElementById(emailTab).append(draftsTable);
}

async function processIndividualEmailsData(userEmailsData, category){
  userEmailsArray  = JSON.parse(userEmailsData.body);
  const emailsInfoArray = [];
  Promise.all(
    userEmailsArray.messages.map( async (email) => {
      const emailInfo = await fetchIndividualEmails(email.id);
      emailsInfoArray.push(emailInfo)
    })
  ).then(() => {
    generateEmailsHtml(emailsInfoArray, category);
  }).catch(err => console.error('err', err));
}

function generateEmailsHtml(emailsInfoArray, category){
  document.getElementById('emailsLoading').classList.add('hidden');
  console.log('---------------------------------------')
  console.log('emailsInfoArray',emailsInfoArray);
  //document.getElementById('emailsList').innerHTML = '';
  let emailTab = 'primaryTab';
  if(category === 'INBOX'){
    document.getElementById('emailsTabList').classList.remove('hidden');
    emailTab = 'primaryTab';
    document.getElementById(emailTab).innerHTML = '';  
  } else if(category === 'CATEGORY_SOCIAL'){
    document.getElementById('emailsTabList').classList.remove('hidden');
    emailTab = 'socialTab';
    document.getElementById(emailTab).innerHTML = '';
  } else if(category === 'CATEGORY_PROMOTIONS'){
    document.getElementById('emailsTabList').classList.remove('hidden');
    emailTab = 'promotionsTab';
    document.getElementById(emailTab).innerHTML = '';
  } else if(category === ' STARRED'){
    emailTable = 'emailsColumn';
    document.getElementById(emailTab).innerHTML = '';
  }
  
  const emailsTable =  document.createElement('div');
  emailsTable.classList.add('container');
  emailsTable.setAttribute('id', `${emailTab}Table`);
  emailsProcessedData = [];
  emailsInfoArray.map(email => {
    const emailProcessedData = {};
    const payloadHeaders = email.result.payload.headers;
    payloadHeaders.map(header => {
      if(header.name === 'Date'){
        emailProcessedData.date = header.value;
      } else if (header.name === 'Subject'){
        emailProcessedData.subject = header.value;
      } else if (header.name === 'From'){
        emailProcessedData.from = header.value;
      }
    })
    emailsProcessedData.push(emailProcessedData);
    const tableRow = document.createElement('div');
    tableRow.classList.add('row','emailsCustomRow');
    tableRow.innerHTML = `
                  <div class="col-4 text-truncate">${emailProcessedData.from}</div>
                  <div class="col-4 text-truncate">${emailProcessedData.subject}</div>
                  <div class="col-4 text-truncate">${emailProcessedData.date}</div>
                `;
    emailsTable.append(tableRow);
  })
  document.getElementById(emailTab).append(emailsTable);
}

let previousTab = '';

function fetchPrimaryMessages(){
  listPrimaryMessages();
}

function showStarred(){
  document.getElementById('emailsTabList').classList.add('hidden');
  fetchAllMessages('STARRED');
}

function showImportantMails(){
  document.getElementById('emailsTabList').classList.add('hidden');
  fetchAllMessages('IMPORTANT');
}

function showSentMails(){
  document.getElementById('emailsTabList').classList.add('hidden');
  fetchAllMessages('STARRED');
}

function showDrafts(){
  document.getElementById('emailsTabList').classList.add('hidden');
  document.getElementById('primaryTab').innerHTML = '';
  fetchAllDrafts();
}

function fetchDrafts(){
  listDrafts();
}

function showPrimaryEmails(){
  if(previousTab !== ''){
    document.getElementById(previousTab).classList.add('hidden');
  }
  document.getElementById('primaryTab').classList.remove('hidden');
  fetchAllMessages('INBOX');
  previousTab = 'primaryTab';
}

function showSocialEmails(){
  if(previousTab !== ''){
    document.getElementById(previousTab).classList.add('hidden');
  }
  document.getElementById('socialTab').classList.remove('hidden');
  fetchAllMessages('CATEGORY_SOCIAL');
  previousTab = 'socialTab';
}

function showPromotionsEmails(){
  if(previousTab !== ''){
    document.getElementById(previousTab).classList.add('hidden');
  }
  document.getElementById('promotionsTab').classList.remove('hidden');
  fetchAllMessages('CATEGORY_PROMOTIONS');
  previousTab = 'promotionsTab';
}

function clickPrimaryTab(){
  document.getElementById('primary-tab').click();
}
