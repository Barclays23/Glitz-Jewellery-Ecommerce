


// <!-- script for deleting address -->
// <!-- script for deleting address -->
function deleteAddress(addressId) {
    console.log('addressId for removing : ', addressId);

    // Show a confirmation dialog
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'No, cancel!'
    }).then((result) => {
        if (result.isConfirmed) {
            // Proceed with deletion if confirmed
            $.ajax({
                url: 'delete-address', 
                method: 'DELETE',
                data: {
                    addressId,
                },
                success: function(response) {
                    console.log(response);
                    if (response.deleted) {
                        Swal.fire({
                            title: "Address Removed",
                            text: "Address has been removed successfully.",
                            icon: "success",
                            showConfirmButton: false,
                            timer: 1500,
                        }).then(() => {
                            location.reload();
                        });
                    }
                },
                error: function(xhr, status, error) {
                    console.error('There was a problem with the AJAX operation:', error);
                }
            });
        }
    });
}
