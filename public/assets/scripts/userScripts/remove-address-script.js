


// <!-- script for deleting address -->
function deleteAddress(addressId) {
    console.log('addressId for removing : ', addressId);

    $.ajax({
        url: 'delete-address', 
        type: 'DELETE',
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