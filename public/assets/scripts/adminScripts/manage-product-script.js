
// <!-- SCRIPT TO MANAGE PRODUCT (BLOCK AND UNBLOCK) -->
    
    function manageProduct(id) {
        console.log('manageProduct id: ', id);

        Swal.fire({
            title: "Are you sure?",
            text: "Do you want to block/unblock this product?",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#28a745",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, confirm!"
        })
        .then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: '/admin/manage-product',
                type: 'PATCH',
                contentType: 'application/json',
                data: JSON.stringify({id}),
                success: function(response) {
                    if (response.success === true){
                        location.reload();
                    } else if(response.categoryBlocked){
                        // Swal.fire("SweetAlert2 is working!");
                        Swal.fire({
                            icon: "error",
                            title: "Cannot list this item. Product category is blocked!",
                            showConfirmButton: false,
                            timer: 3000
                        });
                    }
                },
                error: function(xhr, status, error) {
                    console.log('Error:', error);
                }
            });
        }
        });

    
    }
