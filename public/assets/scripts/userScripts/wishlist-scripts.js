


// <!-- script for add to wishlist and remove from wishlist -->
function addToWishlist(productId){
    console.log('product id for wishlist adding or deleting', productId);

    $.ajax ({
        url : '/add-to-wishlist',
        type : 'POST',
        contentType : 'application/json',
        data : JSON.stringify({productId}),
        success: function(response) {
            console.log('response from add to wishlist :', response);
            if (response.added){
                Swal.fire({
                    text: "Added to your wishlist.",
                    showConfirmButton: false,
                    timer: 1500
                });
                $("#wishlist-count").load("/shopping #wishlist-count");
                $("#wishlist-count").load("/wishlist #wishlist-count");
                $("#wishlist-table").load("/wishlist #wishlist-table");
                // $("#product-actions_"+ productId).load("/shopping #product-actions_"+productId);
                // $("#shop-products").load("/shopping #shop-products");  // not working
                location.reload();
            }  else if (response.removed){
                Swal.fire({
                    text: "Removed from your wishlist.",
                    showConfirmButton: false,
                    timer: 1500
                });
                $("#wishlist-count").load("/shopping #wishlist-count");
                $("#wishlist-count").load("/wishlist #wishlist-count");
                $("#wishlist-table").load("/wishlist #wishlist-table");
                // $("#product-actions_"+ productId).load("/shopping #product-actions_"+productId);
                // $("#shop-products").load("/shopping #shop-products");
                location.reload();
            } else if (response.nosession){
                showAuthSwal();
            }
        },
        error: function(xhr, status, error) {
            console.log('Error in adding to wishlist :', error);
            if (xhr.status === 401) {
                showAuthSwal();
            } else {
                Swal.fire({
                    text: "An error occurred while adding to the cart.",
                    icon: 'error',
                    showConfirmButton: true
                });
            }
        }
    });

}


const signInButtonId = 'signInSwalButton';
const registerButtonId = 'registerSwalButton';

// Function to show the authentication SweetAlert
function showAuthSwal() {
    Swal.fire({
        text: "You need to sign in to add products to your cart.",
        // icon: 'warning',
        showCloseButton: true,
        showCancelButton: true,
        confirmButtonText: '<span id="'+signInButtonId+'">Sign In</span>',
        cancelButtonText: '<span id="'+registerButtonId+'">Register</span>',
        allowOutsideClick: true,
    }).then((result) => {
        const currentUrl = window.location.href;
        if (result.isConfirmed) {
            const signInUrl = `/login?redirect=${encodeURIComponent(currentUrl)}`;
            window.location.href = signInUrl;
        } else if (result.dismiss === Swal.DismissReason.cancel) {
            const registerUrl = `/register?redirect=${encodeURIComponent(currentUrl)}`;
            window.location.href = registerUrl;
        }
    });
}



// <!--script for save for later (move to wishlist and remvoe from the cart / checkout) -->
function saveForLater(productId) {
    console.log('productId for save for later :', productId);

    $.ajax({
        url: '/save-for-later',
        method: 'DELETE',
        data: {
            productId
        },
        success: function(response) {
            if(response.moved) {
                Swal.fire({
                    title: "Item Saved",
                    text: "The item has been saved to wishlist for your future reference.",
                    icon: "success",
                    showConfirmButton: false,
                    timer: 1500,
                })
                $("#wishlist-count").load("/cart #wishlist-count");
                $("#cart-count").load("/cart #cart-count");
                $("#cart-table").load("/cart #cart-table");
                $("#coupon-area").load("/cart #coupon-area");
                $("#cart-summary").load("/cart #cart-summary");
                $("#coupon-area").load("/checkout #coupon-area");
                $("#checkout-summary").load(`/checkout?cartId=${response.cartId} #checkout-summary`);
                
                // .then(() => {
                    // $("#wishlist-count").load("/cart #wishlist-count");
                    // $("#cart-count").load("/cart #cart-count");
                    // $("#cart-table").load("/cart #cart-table");
                    // $("#cart-summary").load("/cart #cart-summary");
                    // $("#checkout-summary").load("/checkout #checkout-summary");
                // });
            } else {
                console.log('Failed to move product to wishlist');
            }
        },
        error: function(error) {
            console.error('Error in save for later :', error);
        }
    });
    

}

