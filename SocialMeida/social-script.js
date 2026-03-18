// ===============================
// COGNITO CONFIGURATION
// ===============================

const poolData = {
  UserPoolId: "eu-north-1_nKCdfiinm",
  ClientId: "7ch4t1mlck2eqr677m7972g2ac"
};

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);


// ===============================
// LIKE TRACKING (NEW)
// ===============================

let likedPosts = {};


// ===============================
// POSTS DATA
// ===============================

const posts = [
  { id: 1, user: "Cloud_Innova", caption: "Building safer cloud platforms 🛡️", img: "https://images.unsplash.com/photo-1563986768609-322da13575f3", likes: 120, comments: [] },
  { id: 2, user: "AI_Forge", caption: "AI moderation is the future 🤖", img: "https://images.unsplash.com/photo-1677442136019-21780ecad995", likes: 98, comments: [] },
  { id: 3, user: "CyberWatch", caption: "Stop phishing attacks early 🔐", img: "https://images.unsplash.com/photo-1510511459019-5dda7724fd87", likes: 210, comments: [] }
];

let activePostId = null;


// ===============================
// RENDER FEED
// ===============================

function renderFeed(){

const feedContainer = document.getElementById("feed-container");

feedContainer.innerHTML = posts.map(p => `

<div class="post-card">

<div class="p-3 fw-bold">@${p.user}</div>

<div class="px-3 small mb-2">${p.caption}</div>

<img src="${p.img}" class="post-img">

<div class="interaction-bar">

<button class="interaction-btn"
style="color:${likedPosts[p.id] ? 'red' : '#64748b'}"
onclick="likePost(${p.id})">

❤️ ${p.likes}

</button>

<button class="interaction-btn" onclick="openComments(${p.id})">

💬 ${p.comments.length}

</button>

</div>

</div>

`).join("");

}



// ===============================
// COGNITO SIGNUP
// ===============================

function signUpUser(username,email,password,phone){

const attributeList=[];

const emailAttr={Name:'email',Value:email};
const phoneAttr={Name:'phone_number',Value:phone};

attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute(emailAttr));
attributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute(phoneAttr));

userPool.signUp(username,password,attributeList,null,function(err){

if(err){
alert(err.message);
return;
}

alert("Signup successful. Check your email for verification.");

});

}



// ===============================
// COGNITO LOGIN
// ===============================

function loginUser(username,password){

const authenticationData={
Username:username,
Password:password
};

const authenticationDetails=new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

const userData={
Username:username,
Pool:userPool
};

const cognitoUser=new AmazonCognitoIdentity.CognitoUser(userData);

cognitoUser.authenticateUser(authenticationDetails,{

onSuccess:function(){

localStorage.setItem("gc_user",username);

showApp(username);

},

onFailure:function(err){
alert(err.message);
}

});

}



// ===============================
// FORGOT PASSWORD
// ===============================

function forgotPassword(username){

const userData={
Username:username,
Pool:userPool
};

const cognitoUser=new AmazonCognitoIdentity.CognitoUser(userData);

cognitoUser.forgotPassword({

onSuccess:function(){
alert("Password reset email sent");
},

onFailure:function(err){
alert(err.message);
}

});

}



// ===============================
// SHOW APP
// ===============================

function showApp(user){

const authSection=document.getElementById("auth-section");
const appSection=document.getElementById("app-section");
const navUsername=document.getElementById("nav-username");

authSection.classList.add("d-none");
appSection.classList.remove("d-none");

navUsername.innerText=`@${user}`;

renderFeed();

}



// ===============================
// MAIN SCRIPT
// ===============================

document.addEventListener("DOMContentLoaded",()=>{

const tabLogin=document.getElementById("tab-login");
const tabSignup=document.getElementById("tab-signup");
const signupFields=document.getElementById("signup-fields");
const authBtn=document.getElementById("auth-btn");

const authUser=document.getElementById("auth-user");
const authPass=document.getElementById("auth-pass");

const modalInput=document.getElementById("modal-input");
const modalPostBtn=document.getElementById("modal-post-btn");
const modalCommentList=document.getElementById("modal-comment-list");

const commentModal=new bootstrap.Modal(document.getElementById("commentModal"));

let currentUser=localStorage.getItem("gc_user");

const API_URL="https://3ljmnqsxd0.execute-api.eu-north-1.amazonaws.com/prod/comment";


// AUTO LOGIN
if(currentUser){
showApp(currentUser);
}


// AUTH TAB SWITCH
window.toggleAuth=(mode)=>{

if(mode==="signup"){

tabSignup.classList.add("active");
tabLogin.classList.remove("active");
signupFields.classList.remove("d-none");

authBtn.innerText="SIGN UP";

}else{

tabLogin.classList.add("active");
tabSignup.classList.remove("active");
signupFields.classList.add("d-none");

authBtn.innerText="LOG IN";

}

};


// AUTH BUTTON
authBtn.addEventListener("click",()=>{

const username=authUser.value.trim();
const password=authPass.value.trim();

if(!username||!password){
alert("Please fill all fields");
return;
}

if(tabSignup.classList.contains("active")){

const email=document.getElementById("auth-email").value.trim();
const phone=document.getElementById("auth-mobile").value.trim();

if(!email||!phone){
alert("Email and mobile required");
return;
}

const formattedPhone=phone.startsWith("+")?phone:"+91"+phone;

signUpUser(username,email,password,formattedPhone);

return;
}

loginUser(username,password);

});



// ===============================
// LIKE POST (UPDATED)
// ===============================

window.likePost=(id)=>{

const post=posts.find(p=>p.id===id);

if(!likedPosts[id]){

post.likes++;
likedPosts[id]=true;

}else{

post.likes--;
likedPosts[id]=false;

}

renderFeed();

};



// ===============================
// OPEN COMMENTS
// ===============================

window.openComments=(id)=>{

activePostId=id;

const post=posts.find(p=>p.id===id);

modalCommentList.innerHTML=post.comments.length
?post.comments.map(c=>`<div class="small mb-1 p-2 bg-light rounded">${c}</div>`).join("")
:`<div class="small text-muted text-center py-2">No comments yet</div>`;

commentModal.show();

};



// ===============================
// POST COMMENT WITH MODERATION
// ===============================

modalPostBtn.addEventListener("click",async()=>{

const text=modalInput.value.trim();
if(!text)return;

const username=localStorage.getItem("gc_user");

let result={status:"SAFE"};

try{

const response=await fetch(API_URL,{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({username:username,comment:text})
});

const data=await response.json();
result=JSON.parse(data.body||JSON.stringify(data));

}catch(e){
console.log("AWS error",e);
}

console.log("AI RESULT:",result);


// BANNED USER
if(result.status==="BANNED"){

alert("🚫 Your account is banned due to repeated spam.");

modalInput.value="";
commentModal.hide();

return;

}


// BLOCK COMMENT
if(result.status==="BLOCKED"){

alert("🚫 GuardianCloud blocked this harmful comment.");

modalInput.value="";
commentModal.hide();

return;

}


// WARNINGS
if(result.status==="SUSPECT"){
alert("⚠ Warning: Suspicious message detected.");
}

if(result.status==="WARNING"){
alert("🚨 Final warning. Next violation will ban your account.");
}


// SHOW COMMENT
const post=posts.find(p=>p.id===activePostId);

let displayText=`@${username}: ${text}`;

if(result.status==="SUSPECT"){
displayText+=" ⚠️";
}

if(result.status==="WARNING"){
displayText+=" 🚨";
}

post.comments.push(displayText);

modalInput.value="";
commentModal.hide();

renderFeed();

});

});


// ===============================
// LOGOUT
// ===============================

function logout(){

localStorage.clear();
location.reload();

}