// Client ID and API key from the Developer Console
var CLIENT_ID = "354191623029-inuaug8o7ca6f909t37miohr1hpcf9gu.apps.googleusercontent.com";
var API_KEY = "AIzaSyD4cUbyfOPegLeDAU-TJym-7DwFQrrEOEw";

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/gmail.modify";

var authorizeButton = document.getElementById("signInButton");
var signOutButton = document.getElementById("signOut_button");

/**
 *  On load, called to load the auth2 library and API client library.
 */
window.handleClientLoad = handleClientLoad;
window.testFun = function (){
  console.log('testing new method');
}
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
    document.getElementById('signInContainer').classList.add('hidden');
    document.getElementById('navBar').classList.remove('hidden');
    showPrimaryEmails();
   // listLabels();
   // listMessages('github');
  } else {
    document.getElementById('signInContainer').classList.remove('hidden');
    document.getElementById('navBar').classList.add('hidden');
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
      //console.log('labels',response);
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
      //console.log('Profile ', userProfileData);
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
    //console.log('Emails ', userEmailsData);
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
    //console.log('Drafts ', userDraftsData);
    processIndividualDraftsData(userDraftsData, 'DRAFTS');
  }catch(err){
    console.error('Error while loading Drafts',err)
  }
}

async function processIndividualDraftsData(userDraftsData, category){
  //console.log(userDraftsData);
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
  //console.log('generateDraftsHtml', draftsInfoArray);
  let emailTab = 'draftsTab';
  document.getElementById(emailTab).innerHTML = '';
  const draftsTable =  document.createElement('div');
  draftsTable.classList.add('container');
  draftsTable.setAttribute('id', `${emailTab}Table`);
  draftsProcessedData = [];

  draftsInfoArray.map(draft => {
    const draftProcessedData = {};
    const isStarred = draft.result.message.labelIds.includes('STARRED');
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
    tableRow.classList.add('row','draftsCustomRow');
    if(isStarred){
      tableRow.classList.add('starred');
    } else {
      tableRow.classList.add('unStarred');
    }
    tableRow.innerHTML = `
                  <div class="col-1">
                    <input type="checkbox" aria-label="Checkbox">
                  </div>
                  <div class="col-1"><i class="material-icons">star_border</i></div>
                  <div class="col-4 text-truncate text-danger">${draftProcessedData.from}</div>
                  <div class="col-4 text-truncate">${draftProcessedData.subject}</div>
                  <div class="col-2 text-truncate">${formatDate(draftProcessedData.date)}</div>
                `;
    draftsTable.append(tableRow);
  })
  document.getElementById(emailTab).append(draftsTable);
}

function formatDate(date){

  const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// document.write("The current month is " + monthNames[d.getMonth()]);
  const dateString = date.substring(0,25);
  const mailDate = new Date(dateString);
  // console.log(temp.getDate())
  // console.log(temp.getDay())
  // console.log(temp.getFullYear())
  // console.log(monthNames[temp.getMonth()])
  let temp = `${mailDate.getDate()} ${monthNames[mailDate.getMonth()].substring(0,3)} ${mailDate.getFullYear()}`
  //console.log('Date ',temp, mailDate.getDate());
  return temp; 
  
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
    document.getElementById('emailsLoading').classList.add('hidden');
    generateEmailsHtml(emailsInfoArray, category);
  }).catch(err => console.error('err', err));
}

function sortEmailsByDate(emailsInfoArray){
  return emailsInfoArray.sort((email1, email2) => {
    return new Date(email2.date) - new Date(email1.date);
  })
}

function processEmailsInfoArray(emailsInfoArray, category){
  const emailsProcessedData = [];
  emailsInfoArray.filter(email => {
    if(category === 'INBOX'){
      if(email.result.labelIds.includes('INBOX') && (email.result.labelIds.includes('CATEGORY_PROMOTIONS'))){
        return false;
      } else if(email.result.labelIds.includes('INBOX') && email.result.labelIds.includes('SENT')){
        return true;
      } else if(!email.result.labelIds.includes('INBOX') && email.result.labelIds.includes('SENT')){
        return false;
      }
    }
    
    return true;
  }).map((email) => {
    
    const emailProcessedData = {};
    emailProcessedData.messageId = email.result.id;
    emailProcessedData.labelIds = email.result.labelIds;
    emailProcessedData.isUnRead = email.result.labelIds.includes('UNREAD');
    emailProcessedData.isStarred = email.result.labelIds.includes('STARRED');
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
  })
  return sortEmailsByDate(emailsProcessedData);
}

function showIndividualEmail(messageId){
  console.log('id', messageId);
}

function generateEmailsHtml(emailsInfoArray, category){
  const sortedEmailsInfoArray = processEmailsInfoArray(emailsInfoArray, category);
  let emailTab = 'primaryTab';
  if(category === 'INBOX'){
    document.getElementById('emailsTabList').classList.remove('hidden');
  } else if(category === 'CATEGORY_SOCIAL'){
    document.getElementById('emailsTabList').classList.remove('hidden');
    emailTab = 'socialTab';
  } else if(category === 'CATEGORY_PROMOTIONS'){
    document.getElementById('emailsTabList').classList.remove('hidden');
    emailTab = 'promotionsTab';
  } else if(category === 'SENT'){
    emailTab = 'sentMailsTab';
  } else if(category === 'STARRED'){
    emailTab = 'starredTab';
  } else if(category === 'IMPORTANT'){
    emailTab = 'importantTab';
  } else if(category === 'STARRED'){
    emailTab = 'starredTab';
  } 
  
  const emailsTable =  document.createElement('div');
  emailsTable.classList.add('container');
  emailsTable.setAttribute('id', `${emailTab}Table`);
  emailsProcessedData = [];
  sortedEmailsInfoArray.map(email => {
    const tableRow = document.createElement('div');
    tableRow.classList.add('row','emailsCustomRow');
    
    tableRow.setAttribute("onclick",`showIndividualEmail('${email.messageId}')`);
    if(!email.isUnRead){
      tableRow.classList.add('emailRead');
    }
    if(email.isStarred){
      tableRow.classList.add('starred');
    } else {
      tableRow.classList.add('unStarred');
    }
    tableRow.innerHTML = `
                  <div class="col-1">
                    <input type="checkbox" aria-label="Checkbox">
                  </div>
                  <div class="col-1"><i class="material-icons">star_border</i></div>
                  <div class="col-4 text-truncate">${email.from}</div>
                  <div class="col-4 text-truncate">${email.subject}</div>
                  <div class="col-2 text-truncate">${formatDate(email.date)}</div>
                `;
    emailsTable.append(tableRow);
  })
  document.getElementById(emailTab).append(emailsTable);
}

let previousTab = '';
let previousButton = 'homeButton';

function showPrimaryEmails(){
  if(previousTab !== ''){
    document.getElementById(previousTab).innerHTML = '';
    document.getElementById(previousTab).classList.add('hidden');
  }
  if(previousButton !== ''){
    document.getElementById(previousButton).classList.remove('active');
  }
  document.getElementById('primaryTab').classList.remove('hidden');
  document.getElementById('homeButton').classList.add('active');
  fetchAllMessages('INBOX');
  previousTab = 'primaryTab';
  previousButton = 'homeButton';
}

function showSocialEmails(){
  if(previousTab !== ''){
    document.getElementById(previousTab).innerHTML = '';
    document.getElementById(previousTab).classList.add('hidden');
  }
  document.getElementById('socialTab').classList.remove('hidden');
  fetchAllMessages('CATEGORY_SOCIAL');
  previousTab = 'socialTab';
}

function showPromotionsEmails(){
  if(previousTab !== ''){
    document.getElementById(previousTab).innerHTML = '';
    document.getElementById(previousTab).classList.add('hidden');
  }
  document.getElementById('promotionsTab').classList.remove('hidden');
  document.getElementById(previousTab).innerHTML = '';
  fetchAllMessages('CATEGORY_PROMOTIONS');
  previousTab = 'promotionsTab';
}

function showStarred(){
  if(previousTab !== ''){
    document.getElementById(previousTab).innerHTML = '';
    document.getElementById(previousTab).classList.add('hidden');
  }
  if(previousButton !== ''){
    document.getElementById(previousButton).classList.remove('active');
  }
  document.getElementById('starredTab').classList.remove('hidden');
  document.getElementById('starredButton').classList.add('active');
  fetchAllMessages('STARRED');
  previousTab = 'starredTab';
  previousButton = 'starredButton';
}

function showImportantMails(){
  if(previousTab !== ''){
    document.getElementById(previousTab).innerHTML = '';
    document.getElementById(previousTab).classList.add('hidden');
  }
  if(previousButton !== ''){
    document.getElementById(previousButton).classList.remove('active');
  }
  document.getElementById('importantTab').classList.remove('hidden');
  document.getElementById('importantButton').classList.add('active');
  fetchAllMessages('IMPORTANT');
  previousTab = 'importantTab';
  previousButton = 'importantButton';
}

function showSentMails(){
  if(previousTab !== ''){
    document.getElementById(previousTab).innerHTML = '';
    document.getElementById(previousTab).classList.add('hidden');
  }
  if(previousButton !== ''){
    document.getElementById(previousButton).classList.remove('active');
  }
  document.getElementById('sentMailsTab').classList.remove('hidden');
  document.getElementById('sentMailsButton').classList.add('active');
  fetchAllMessages('SENT');
  previousTab = 'sentMailsTab';
  previousButton = 'sentMailsButton';
}

function showDrafts(){
  if(previousTab !== ''){
    document.getElementById(previousTab).innerHTML = '';
    document.getElementById(previousTab).classList.add('hidden');
  }
  if(previousButton !== ''){
    document.getElementById(previousButton).classList.remove('active');
  }
  document.getElementById('draftsTab').classList.remove('hidden');
  document.getElementById('draftsButton').classList.add('active');
  fetchAllDrafts();
  previousTab = 'draftsTab';
  previousButton = 'draftsButton';
}

function refreshCurrentTab(){
  switch(previousTab) {
    case 'primaryTab':
      document.getElementById('primary-tab').click();    
      break;
    case 'socialTab':
      document.getElementById('social-tab').click();    
      break;
    case 'promotionsTab':
      document.getElementById('promotions-tab').click();    
      break;
    case 'starredTab':
      document.getElementById('starred-tab').click();    
      break;
    case 'importantTab':
      document.getElementById('important-tab').click();    
      break;    
    case 'sentMailsTab':
      document.getElementById('sentMails-tab').click();    
      break;    
    case 'draftsTab':
      document.getElementById('drafts-tab').click();    
      break;    
    default:
      document.getElementById('primary-tab').click();    
      break;
  }
}

function clickPrimaryTab(){
  document.getElementById('primary-tab').click();
}

function clickStarredTab(){
  document.getElementById('starred-tab').click();
}

function clickImportantMailsTab(){
  document.getElementById('important-tab').click();
}

function clickSentMailsTab(){
  document.getElementById('sentMails-tab').click();
}

function clickDraftsTab(){
  document.getElementById('drafts-tab').click();
}

function cancelSendingEmail(){

}

function clearEmailErrorMessage(){
  document.getElementById('emailHelp').innerHTML = '';
}

function sendEmail(){
  const toEmail = document.getElementById('toEmailId').value;
  document.getElementById('emailHelp').innerHTML = '';
  if(toEmail === '' ){
    document.getElementById('toEmailId').focus();
    document.getElementById('emailHelp').innerHTML = 'Please specify at least one recipient'
    document.getElementById('emailHelp').style.color = 'red';
    return;
  }
  const ccBccEmailId = document.getElementById('ccBccEmailId').value;
  const emailSubject = document.getElementById('emailSubject').value;
  const emailBody = document.getElementById('emailBody').value;

  const mimeData = [
    "From:ravikiran.code@gmail.com",
    "To:"+toEmail,
    "Subject: =?utf-8?B?" + window.btoa(unescape(encodeURIComponent(emailSubject))) + "?=",
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    ""+ emailBody].join("\n").trim();
  const raw = window.btoa(unescape(encodeURIComponent(mimeData))).replace(/\+/g, '-').replace(/\//g, '_');

  //console.log(raw);
  //console.log('sendEmail');

  gapi.client.gmail.users.messages.send({
    'userId': 'me',
    'resource': {
      'raw': raw
    }
  }).execute(res => {
    console.log('Email sent', res);
    //this.snackBar.success('Email has send Successfully')
  });


  $('#sendEmailModal').modal('hide')
}

$('#sendEmailModal').on('hidden.bs.modal', function (e) {
  console.log('modal closed');
})