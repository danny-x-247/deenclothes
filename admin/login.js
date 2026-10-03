// ==========================================
// SUPABASE CONNECTION
// ==========================================

const SUPABASE_URL = "https://onxnvikccaxpypqtfubx.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_vsIURKXFies4q7BaIJsRgg_nkOP0hjC";


const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


// ==========================================
// ELEMENTS
// ==========================================

const loginForm =
    document.getElementById("loginForm");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const loginBtn =
    document.getElementById("loginBtn");

const message =
    document.getElementById("message");


// ==========================================
// LOGIN
// ==========================================

loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;


        message.textContent =
            "Signing in...";

        message.style.color =
            "#555";


        loginBtn.disabled = true;

        loginBtn.textContent =
            "Signing In...";


        const {
            data,
            error
        } = await supabaseClient.auth
            .signInWithPassword({
                email: email,
                password: password
            });


        if (error) {

            console.error(error);

            message.textContent =
                "Incorrect email or password.";

            message.style.color =
                "crimson";

            loginBtn.disabled = false;

            loginBtn.textContent =
                "Sign In";

            return;
        }


        if (data.session) {

            message.textContent =
                "Login successful!";

            message.style.color =
                "green";


            window.location.href =
                "admin.html";
        }
    }
);


// ==========================================
// ALREADY LOGGED IN?
// ==========================================

async function checkExistingLogin() {

    const {
        data: { session }
    } = await supabaseClient.auth
        .getSession();


    if (session) {

        window.location.href =
            "admin.html";
    }
}


checkExistingLogin();