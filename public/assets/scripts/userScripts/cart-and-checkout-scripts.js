

// <!-- to update cart product quantity -->
$(document).ready(function(){
    $('.quantity-input').on('change', function() {
        var newQuantity = $(this).val();
        var productId = $(this).data('product-id');
        var index = $(this).data('index');
        
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
                    newQuantity
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
                        // Update the total price for the product (reload the div / id)
                        $("#total_price_"+index).load("/cart #total_price_"+index);
                        $("#cart-summary").load("/cart #cart-summary");
                        $("#checkout-summary").load("/checkout #checkout-summary");
                        $("#cart-count").load("/cart #cart-count");
                        // $('#total_price_' + response.index).text('₹' + response.updatedTotalPrice.toFixed(2));
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
                    if(response.removedProduct) {
                        Swal.fire({
                            title: "Item Removed",
                            text: "The item has been removed from your cart.",
                            icon: "success",
                            showConfirmButton: false,
                            timer: 1500,
                        }).then(() => {
                            location.reload();
                        });
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
function proceedToCheckout(userId) {
    $.ajax({
        url: '/proceed-to-checkout',
        method: 'POST',
        success: function (response) {
            console.log('response for proceedToCheckout :', response);
            if(response.nocartItems){
                Swal.fire({
                    title: 'Empty Cart',
                    text: 'Your cart is empty. Please add items before checking out.',
                    icon: 'warning',
                })
            } else if (response.outofstockfound) {
                Swal.fire({
                    icon: 'warning',
                    title: "Unavailable items in cart.",
                    text: 'Some items in your cart are currently unavailable.. Please remove them or save for later before proceeding to checkout.',
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
                        
                    } else if (result.isDenied) {  // if clicked save for later
                        Swal.fire("Saved & Cart Updated", "Unavailable items are saved to your wishlist", "success")
                        .then(()=>{
                            window.location.href = '/checkout'; // Proceed to the checkout page after items saved to wishlist.
                        });
                    }
                });

            } else if(response.proceed){
                window.location.href = '/checkout'; // Proceed to the checkout page if all items are in stock
            }
        },
        error: function (xhr) {
            console.log('error for proceedToCheckout');
        }
    });

}





// <!-- to manage the out of stock items from cart. -->
function removeOutOfStockItems(outOfStockItems) {
    $.ajax({
        url: '/remove-from-cart',
        method: 'DELETE',
        data: JSON.stringify({ outOfStockItems }),
        contentType: 'application/json',
        success: function(response) {
            console.log('response from updateCart : ', response);
            if(response.removedOutOfStock){
                Swal.fire("Removed Items!", "Unavailable items have been removed from your cart.", "success")
                .then(()=>{
                    window.location.href = '/checkout';  // Proceed to the checkout page after removed from cart.
                });
            }
        },
        error: function(xhr) {
            Swal.fire({
            title: 'Error removing outofstock from cart',
            text: xhr.responseText,
            icon: 'error',
            confirmButtonText: 'OK'
            });
        }
    });

}






// url: '/save-for-later', add (to move the products to wishlist)
// method: 'POST',  /DELETE






// cart & checkout styles
// <!-- <style>
// .warning-swal-text {
//     color: #ffffff;
// }
// .warning-swal-background {
//     background-color: #fff156;
// }
// .success-swal-background {
//     background-color: #b2ff73;
// }
// </style> -->