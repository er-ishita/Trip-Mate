// Preview uploaded image
document.getElementById('imgUpload')?.addEventListener('change', function(e){
    const file = e.target.files[0];
    if(file){
        const reader = new FileReader();
        reader.onload = function(ev){
            document.getElementById('profilePicPreview').src = ev.target.result;
        }
        reader.readAsDataURL(file);
    }
});

function saveProfile(){
    const data = {
        name: value('name'),
        email: value('email'),
        enroll: value('enroll'),
        branch: value('branch'),
        year: value('year'),
        gender: value('gender'),
        phone: value('phone'),
        travel: value('travel'),
        history: value('history')
    };

    const img = document.getElementById('imgUpload').files[0];

    if(img){
        const reader = new FileReader();
        reader.onload = e => {
            data.image = e.target.result;
            storeAndGo(data);
        };
        reader.readAsDataURL(img);
    } else {
        storeAndGo(data);
    }
}

function storeAndGo(data){
    localStorage.setItem("profileData", JSON.stringify(data));
    window.location.href = "view-profile.html";
}

function value(id){ return document.getElementById(id).value; }

function clearProfile(){
    localStorage.removeItem("profileData");
    alert("Data cleared!");
}

window.onload = function(){
    const d = JSON.parse(localStorage.getItem("profileData") || "{}");

    if(document.getElementById("v_name")){
        set("v_name", d.name);
        set("v_email", d.email);
        set("v_enroll", d.enroll);
        set("v_branch", d.branch);
        set("v_year", d.year);
        set("v_gender", d.gender);
        set("v_phone", d.phone);
        set("v_travel", d.travel);
        set("v_history", d.history);

        if(d.image) document.getElementById("profilePic").src = d.image;
    }
}

function set(id, val){ document.getElementById(id).innerText = val || ""; }
