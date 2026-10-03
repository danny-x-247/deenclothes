// ==========================================
// SUPABASE CONNECTION
// ==========================================

const SUPABASE_URL = "https://onxnvikccaxpypqtfubx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vsIURKXFies4q7BaIJsRgg_nkOP0hjC";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


// ==========================================
// HTML ELEMENTS
// ==========================================

const productForm = document.getElementById("productForm");
const productList = document.getElementById("productList");

const productName = document.getElementById("productName");
const productCategory = document.getElementById("productCategory");
const productPrice = document.getElementById("productPrice");
const productImage = document.getElementById("productImage");
const productBadge = document.getElementById("productBadge");

const addProductBtn = document.getElementById("addProductBtn");
const statusMessage = document.getElementById("statusMessage");
const imagePreview = document.getElementById("imagePreview");
const logoutBtn = document.getElementById("logoutBtn");

let editingProductId = null;


// ==========================================
// STATUS MESSAGE
// ==========================================

function showMessage(message, isError = false) {

    statusMessage.textContent = message;

    statusMessage.style.padding = "12px";
    statusMessage.style.marginBottom = "15px";

    statusMessage.style.color =
        isError ? "crimson" : "green";
}


// ==========================================
// IMAGE PREVIEW
// ==========================================

productImage.addEventListener("change", function () {

    const file = productImage.files[0];

    if (!file) {
        imagePreview.hidden = true;
        imagePreview.src = "";
        return;
    }

    imagePreview.src = URL.createObjectURL(file);

    imagePreview.hidden = false;

    imagePreview.style.width = "120px";
    imagePreview.style.height = "120px";
    imagePreview.style.objectFit = "cover";
    imagePreview.style.marginTop = "10px";
    imagePreview.style.borderRadius = "8px";
});


// ==========================================
// CHECK ADMIN LOGIN
// ==========================================

async function checkAdmin() {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (!session) {

        alert("Please login first.");

        // We will create login.html next
        window.location.href = "login.html";

        return false;
    }

    const adminUser = document.getElementById("adminUser");

    if (adminUser) {
        adminUser.textContent = session.user.email;
    }

    return true;
}


// ==========================================
// LOAD PRODUCTS
// ==========================================

async function loadProducts() {

    productList.innerHTML = `
        <tr>
            <td colspan="6">
                Loading products...
            </td>
        </tr>
    `;

    const { data, error } = await supabaseClient
        .from("products")
        .select("*")
        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error(error);

        productList.innerHTML = `
            <tr>
                <td colspan="6">
                    Could not load products.
                </td>
            </tr>
        `;

        return;
    }


    productList.innerHTML = "";


    if (!data || data.length === 0) {

        productList.innerHTML = `
            <tr>
                <td colspan="6">
                    No products added yet.
                </td>
            </tr>
        `;

        return;
    }


    data.forEach(function (product) {

        const row = document.createElement("tr");

        row.innerHTML = `

            <td>
                <img
                    src="${product.image_url}"
                    alt="${product.name}"
                    width="60"
                    height="60"
                    style="
                        object-fit:cover;
                        border-radius:6px;
                    "
                >
            </td>

            <td>
                ${product.name}
            </td>

            <td>
                ${product.category}
            </td>

            <td>
                ₦${Number(product.price).toLocaleString()}
            </td>

            <td>
                ${product.badge || ""}
            </td>

            <td>

                <button
                    class="btn btn-edit"
                    onclick="editProduct(${product.id})"
                >
                    Edit
                </button>

                <button
                    class="btn btn-delete"
                    onclick="deleteProduct(${product.id})"
                >
                    Delete
                </button>

            </td>
        `;

        productList.appendChild(row);
    });
}


// ==========================================
// UPLOAD PRODUCT IMAGE
// ==========================================

async function uploadProductImage(file) {

    const fileExtension =
        file.name.split(".").pop();

    const fileName =
        `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}.${fileExtension}`;


    const { error } = await supabaseClient
        .storage
        .from("product-images")
        .upload(fileName, file);


    if (error) {
        throw error;
    }


    const { data } = supabaseClient
        .storage
        .from("product-images")
        .getPublicUrl(fileName);


    return data.publicUrl;
}


// ==========================================
// ADD PRODUCT
// ==========================================

productForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const name =
            productName.value.trim();

        const category =
            productCategory.value.trim();

        const price =
            Number(productPrice.value);

        const badge =
            productBadge.value.trim();

        const imageFile =
            productImage.files[0];


        if (!name || !category || !price) {

            showMessage(
                "Please fill in all required fields.",
                true
            );

            return;
        }


        try {

            addProductBtn.disabled = true;

            addProductBtn.textContent =
                editingProductId
                    ? "Updating..."
                    : "Uploading...";


            // ==================================
            // UPDATE PRODUCT
            // ==================================

            if (editingProductId !== null) {

                const updateData = {
                    name: name,
                    category: category,
                    price: price,
                    badge: badge
                };


                // Upload a new image only
                // if the owner selected one
                if (imageFile) {

                    const imageUrl =
                        await uploadProductImage(
                            imageFile
                        );

                    updateData.image_url =
                        imageUrl;
                }


                const { error } =
                    await supabaseClient
                        .from("products")
                        .update(updateData)
                        .eq(
                            "id",
                            editingProductId
                        );


                if (error) {
                    throw error;
                }


                showMessage(
                    "Product updated successfully."
                );

                editingProductId = null;
            }


            // ==================================
            // ADD NEW PRODUCT
            // ==================================

            else {

                if (!imageFile) {

                    showMessage(
                        "Please choose a product image.",
                        true
                    );

                    return;
                }


                addProductBtn.textContent =
                    "Uploading image...";


                const imageUrl =
                    await uploadProductImage(
                        imageFile
                    );


                addProductBtn.textContent =
                    "Saving product...";


                const { error } =
                    await supabaseClient
                        .from("products")
                        .insert([
                            {
                                name: name,
                                category: category,
                                price: price,
                                badge: badge,
                                image_url: imageUrl
                            }
                        ]);


                if (error) {
                    throw error;
                }


                showMessage(
                    "Product added successfully!"
                );
            }


            // Clear form
            productForm.reset();

            imagePreview.hidden = true;
            imagePreview.src = "";

            addProductBtn.textContent =
                "Add Product";


            // Reload products
            await loadProducts();

        }

        catch (error) {

            console.error(error);

            showMessage(
                error.message ||
                "Something went wrong.",
                true
            );

        }

        finally {

            addProductBtn.disabled = false;

            if (editingProductId === null) {
                addProductBtn.textContent =
                    "Add Product";
            }
        }
    }
);


// ==========================================
// EDIT PRODUCT
// ==========================================

async function editProduct(id) {

    const { data, error } =
        await supabaseClient
            .from("products")
            .select("*")
            .eq("id", id)
            .single();


    if (error) {

        console.error(error);

        showMessage(
            "Could not load product.",
            true
        );

        return;
    }


    productName.value =
        data.name || "";

    productCategory.value =
        data.category || "";

    productPrice.value =
        data.price || "";

    productBadge.value =
        data.badge || "";


    editingProductId = id;


    addProductBtn.textContent =
        "Update Product";


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ==========================================
// DELETE PRODUCT
// ==========================================

async function deleteProduct(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this product?"
    );


    if (!confirmed) {
        return;
    }


    const { error } =
        await supabaseClient
            .from("products")
            .delete()
            .eq("id", id);


    if (error) {

        console.error(error);

        showMessage(
            "Could not delete product.",
            true
        );

        return;
    }


    showMessage(
        "Product deleted successfully."
    );


    await loadProducts();
}


// ==========================================
// LOGOUT
// ==========================================

logoutBtn.addEventListener(
    "click",
    async function () {

        await supabaseClient.auth.signOut();

        window.location.href =
            "login.html";
    }
);


// ==========================================
// START ADMIN DASHBOARD
// ==========================================

async function startAdmin() {

    const loggedIn =
        await checkAdmin();

    if (!loggedIn) {
        return;
    }

    await loadProducts();
}


startAdmin();S