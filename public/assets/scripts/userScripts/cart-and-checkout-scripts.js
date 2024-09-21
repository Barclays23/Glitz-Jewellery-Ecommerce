

// to add the product to the cart (send data to backend)
function addToCart(productId) {
    console.log('product id for adding to cart: ', productId);

    $.ajax ({
        url : '/add-to-cart',
        type : 'POST',
        contentType : 'application/JSON',
        data : JSON.stringify({productId}),
        success: function(response) {
            console.log('response from add to cart :', response);
            if (response.success){
                Swal.fire({
                    text: "Added to your cart.",
                    icon: 'success',
                    showConfirmButton: false,
                    timer: 1500
                });
                $("#cart-count").load("/shopping #cart-count");
            } else if (response.outofstock){
                Swal.fire({
                    // text: "Unfortunately, this item is out of stock and cannot be added to your cart.",
                    text: "We are sorry, but this product is currently unavailable for purchase.",
                    showConfirmButton: false,
                    timer: 2000,
                    customClass: {
                        popup: 'error-swal-background',
                        // htmlContainer: 'error-swal-text',
                        // popup: 'bg-danger',
                        htmlContainer: 'text-white'
                    }
                })
            } else if (response.nosession){
                showAuthSwalForCart();
            } else if (response.existProduct){
                Swal.fire({
                    text: "Product already added to your cart!",
                    showConfirmButton: false,
                    timer: 1500
                })
            }
        },
        error: function(xhr, status, error) {
            console.log('Error in adding to cart :', error);
            if (xhr.status === 401) {
                showAuthSwalForCart();
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






// Function to show the authentication SweetAlert
function showAuthSwalForCart() {
    const signInButtonId = 'signInSwalButton';
    const registerButtonId = 'registerSwalButton';
    
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






// <!-- to update cart product quantity -->
$(document).ready(function(){
    $('.quantity-input').on('change', function() {
        var newQuantity = $(this).val();
        var productId = $(this).data('product-id');
        var index = $(this).data('index');
        var cartId = $(this).data('cart-id');

        console.log('cartId in front end to reload :', cartId);
        
        var isValid = true;

        // Ensure newQuantity is a positive integer greater than 0
        if (newQuantity < 1 || isNaN(newQuantity) || parseInt(newQuantity) != newQuantity) {
            Swal.fire({
                text: "The quantity must be at least one or more.",
                icon: 'warning',
                showConfirmButton: false,
                timer: 1500
            });
            $(this).val(1);
            newQuantity = 1;
            isValid = false;
        }
        
        console.log('productId is :' , productId);
        console.log('index is :' , index);
        console.log('newQuantity is :' , newQuantity);

        if(isValid){
            $.ajax({
                url: '/update-cart-quantity',
                method: 'POST',
                data: {
                    productId,
                    index,
                    newQuantity,
                    cartId
                },
                success: function(response) {
                    if (response.insufficient) {
                        Swal.fire({
                            text: "Unfortunately, we only have " + response.inventoryQuantity + " units of this product in stock. Please adjust the quantity in your cart accordingly.",
                            // icon: 'warning',
                            showConfirmButton: false,
                            timer: 3500,
                            customClass: {
                                popup: 'warning-swal-background',
                                htmlContainer: 'warning-swal-text'
                            }
                        });
                        $('#quantity_' + index).val(response.inventoryQuantity);
                        newQuantity = response.inventoryQuantity;

                    } else if(response.success){
                        $("#total_price_"+index).load("/cart #total_price_"+index);
                        $("#total_price_"+index).load("/checkout #total_price_"+index);
                        $("#cart-summary").load("/cart #cart-summary");
                        $("#checkout-summary").load(`/checkout?cartId=${response.cartId} #checkout-summary`);
                        $("#cart-count").load("/cart #cart-count");
                    }
                    
                },
                error: function(error) {
                    console.error('Error updating quantity:', error);
                }
            });
        }
    });

});





// <!-- to remove product from the cart / checkout -->
function removeFromCart(productId, index) {
    console.log('index for removing from cart :', index);
    console.log('productId for removing from cart :', productId);

    Swal.fire({
        title: "Are you sure?",
        text: "Item will be removed from your cart and you won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "green",
        confirmButtonText: "Confirm"
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: '/remove-from-cart',
                method: 'DELETE',
                data: {
                    productId,index
                },
                success: function(response) {
                    console.log('response from removeFromCart : ', response);

                    if (response.removedProduct) {
                        Swal.fire({
                            title: "Item Removed",
                            text: "The item has been removed from your cart.",
                            icon: "success",
                            showConfirmButton: false,
                            timer: 1500,
                        });
                        $("#wishlist-count").load("/cart #wishlist-count");
                        $("#cart-count").load("/cart #cart-count");
                        $("#cart-table").load("/cart #cart-table");
                        $("#coupon-area").load("/cart #coupon-area");
                        $("#cart-summary").load("/cart #cart-summary");
                        $("#coupon-area").load("/checkout #coupon-area");
                        $("#checkout-summary").load(`/checkout?cartId=${response.cartId} #checkout-summary`);

                    } else if(response.emptyCart){
                        window.location.href = '/cart';
                    } else {
                        console.log('Failed to remove product from cart');
                    }
                },
                error: function(error) {
                    console.error('Error in removing from cart:', error);
                }
            });
        }
    });
}





// <!-- script for validating the carted items before proceed to checkout. -->
function proceedToCheckout(userId, event) {

    if (event) {
        event.preventDefault();
    }

    $.ajax({
        url: '/proceed-to-checkout',
        method: 'POST',
        success: function (response) {
            console.log('response for proceedToCheckout :', response);
            if (response.nocartItems){
                Swal.fire({
                    title: 'Empty Cart',
                    text: 'Your cart is empty. Please add items before checking out.',
                    icon: 'warning',
                    showConfirmButton: false
                })
            } else if (response.outofstockfound) {
                console.log('outofstockfound swal started running.');
                Swal.fire({
                    icon: 'warning',
                    title: "Unavailable items in cart.",
                    text: 'Some items in your cart are currently unavailable.. Please remove them or save for later before proceeding to checkout. Note: This will also reflect on your coupon discounts based on your subtotal.',
                    showDenyButton: true,
                    showCancelButton: true,
                    confirmButtonText: "Remove & Proceed",
                    denyButtonText: `Save for later`,
                    cancelButtonText: 'Cancel',
                    confirmButtonColor: "red",
                    // confirmButtonColor: "#3085d6",
                    denyButtonColor: "green",
                }).then((result) => {
                    if (result.isConfirmed) { // if clicked Remove & Proceed button
                        removeOutOfStockItems(response.outOfStockItems);
                        
                    } else if (result.isDenied) {  // if clicked Save for later button
                        saveOutOfStockItems(response.outOfStockItems);
                    }
                }).catch((error) => {
                    console.log('outofstockfound Swal error :', error);
                });

            } else if(response.proceed){
                window.location.href = `/checkout?cartId=${response.cartId}`; // Proceed to the checkout page if all items are in stock
            }
        },
        error: function (xhr) {
            console.log('error for proceedToCheckout');
        }
    });

}





// <!-- to remove out of stock items from cart. -->
function removeOutOfStockItems(outOfStockItems) {
    console.log('removeOutOfStockItems() start running.');
    $.ajax({
        url: '/remove-from-cart',
        method: 'DELETE',
        data: JSON.stringify({ outOfStockItems }),
        contentType: 'application/json',
        success: function(response) {
            console.log('response from updateCart : ', response);
            if(response.removedOutOfStock){
                Swal.fire({
                    icon: 'success',
                    title: "Items Removed!",
                    text: 'Unavailable items have been removed from your cart.',
                    showConfirmButton: false,
                    timer: 1000
                })
                .then(()=>{
                    console.log('response.cartId : ', response.cartId);
                    window.location.href = `/checkout?cartId=${response.cartId}` // Proceed to the checkout page after removed from cart.
                });
            } else if (response.error) {
                Swal.fire({
                    icon: 'error',
                    title: "Error while removing out of stock items.",
                    text: response.message,
                    showConfirmButton: false,
                });
            }
        },
        error: function(xhr) {
            Swal.fire({
            title: 'Error removing outofstock from cart',
            // text: xhr.message,
            // text: xhr.responseText,
            icon: 'error',
            confirmButtonText: 'OK'
            });
        }
    });

}






// <!-- to save/move the out of stock items to wishlist -->
function saveOutOfStockItems(outOfStockItems) {
    $.ajax({
        url: '/save-for-later',
        method: 'DELETE',
        data: JSON.stringify({ outOfStockItems }),
        contentType: 'application/json',
        success: function(response) {
            console.log('response from saveForLater : ', response);
            if (response.movedOutOfStocks){
                Swal.fire({
                    title: "Items Saved",
                    text: "Unavailable items have been saved to wishlist for your future reference.",
                    icon: "success",
                    showConfirmButton: false,
                    timer: 1500,
                })
                .then(()=>{
                    console.log('response.cartId : ', response.cartId);
                    window.location.href = `/checkout?cartId=${response.cartId}` // Proceed to the checkout page after removed from cart.
                })
            }
        },
        error: function(xhr) {
            Swal.fire({
            title: 'Error while shifting the outofstock items.',
            text: xhr.responseText,
            icon: 'error',
            confirmButtonText: 'OK'
            });
        }
    });

}





// for applying the coupon
function applyCoupon() {
    let couponCode = $('#coupon-field').val();
    console.log('couponCode to send for applying :', couponCode);

    if (couponCode === '') {
        Swal.fire({
            text: 'Please enter a coupon code.',
            showConfirmButton: false,
        });
        return;
    }

    $.ajax({
        url: '/apply-coupon',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ couponCode }),
        success: function(response) {
            if (response.applied) {
                Swal.fire({
                    icon: 'success',
                    text: 'Coupon applied successfully!',
                    showConfirmButton: false,
                    timer: 1000,
                });
                $("#coupon-area").load("/cart #coupon-area");
                $("#cart-summary").load("/cart #cart-summary");
                $("#coupon-area").load("/checkout #coupon-area");
                $("#checkout-summary").load(`/checkout?cartId=${response.cartId} #checkout-summary`);

            } else if (response.notfound) {
                Swal.fire({
                    text: response.message,
                    showConfirmButton: false,
                });
            } else if (response.expired) {
                Swal.fire({
                    text: response.message,
                    showConfirmButton: false,
                });
            } else if (response.inactive) {
                Swal.fire({
                    text: response.message,
                    showConfirmButton: false,
                });
            } else if (response.alreadyused) {
                Swal.fire({
                    text: response.message,
                    showConfirmButton: false,
                });
            } else if (response.notEligible) {
                Swal.fire({
                    text: response.message,
                    showConfirmButton: false,
                });
            } 
        },
        error: function(xhr, status, error) {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'An error occurred while applying the coupon.',
            });
        }
    });
}





// for cancelling the coupon
function cancelCoupon() {
    let couponCode = $('#coupon-field').val();
    console.log('couponCode to send for cancelling:', couponCode);

    $.ajax({
        url: '/cancel-coupon',
        method: 'PATCH',
        // contentType: 'application/json',
        // data: JSON.stringify({ couponCode }),
        success: function(response) {
            if (response.cancelled) {
                console.log('response after cancelling the coupon :', response);
                
                Swal.fire({
                    icon: 'success',
                    text: 'Coupon cancelled !',
                    showConfirmButton: false,
                    timer: 1000,
                });
                $("#coupon-area").load("/cart #coupon-area");
                $("#cart-summary").load("/cart #cart-summary");
                $("#coupon-area").load("/checkout #coupon-area");
                $("#checkout-summary").load(`/checkout?cartId=${response.cartId} #checkout-summary`);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Failed to cancel coupon',
                    text: response.message,
                });
            }
        },
        error: function(error) {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'An error occurred while canceling the coupon.',
            });
        }
    });
}





// // cart & checkout styles
// <style>
// .warning-swal-text {
//     color: #ffffff;
// }
// .warning-swal-background {
//     background-color: #fff156;
// }
// .success-swal-background {
//     background-color: #b2ff73;
// }
// </style>