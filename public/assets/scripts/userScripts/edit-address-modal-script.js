// <!-- script for edit address modal -->

$(document).ready(function() {
    // Toggle dropdown list visibility when clicking selector or typing
    $('.dropdown-selector').on('click', function(event) {
        event.stopPropagation();
        $(this).find('.dropdown-list').toggle();
    });

    // Close dropdown when clicking outside of it
    $(document).on('click', function() {
        $('.dropdown-list').hide();
    });


    // Filter dropdown list based on input
    $('#edit-state-input').on('input', function() {
        const inputValue = $(this).val().toLowerCase().trim();
        $('#edit-state li').each(function() {
            const state = $(this).data('value').toLowerCase();
            if (state.includes(inputValue)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
        $('.dropdown-list').show();
    });

    
    // Handle selection of state from dropdown list
    $('#edit-state').on('click', 'li', function() {
        const selectedState = $(this).data('value');
        $('#edit-state-input').val(selectedState);
        $('.dropdown-list').hide(); // Hide the dropdown list after selection
    });



    // Handle edit address link click to populate modal fields
    $('.edit-address-link').on('click', function(event) {
        event.preventDefault();
        const addressId = $(this).data('address-id');
        const index = $(this).data('index');
        const firstname = $(this).data('firstname');
        const lastname = $(this).data('lastname');
        const street = $(this).data('street');
        const city = $(this).data('city');
        const state = $(this).data('state');
        const pincode = $(this).data('pincode');
        const contact = $(this).data('contact');

        // Populate modal form fields with default values
        $('#edit-firstname').val(firstname);
        $('#edit-lastname').val(lastname);
        $('#edit-address').val(street);
        $('#edit-city').val(city);
        $('#edit-pincode').val(pincode);
        $('#edit-state-input').val(state);
        $('#edit-phone').val(contact);
        $('#editAddressModal').attr('data-address-id', addressId); // Store address ID in a hidden field or data attribute in modal
    });


    $('#updateChanges').on('click', function() {
        event.preventDefault();

        const firstname = $('#edit-firstname').val()
        const lastname = $('#edit-lastname').val()
        const address = $('#edit-address').val()
        const city = $('#edit-city').val()
        const zipcode = $('#edit-pincode').val()
        const state = $('#edit-state-input').val().trim()
        const phone = $('#edit-phone').val()
        const addressId = $('#editAddressModal').data('address-id')

        console.log("Firstname: ", firstname);
        console.log("Lastname: ", lastname);
        console.log("Address: ", address);
        console.log("City: ", city);
        console.log("Pincode: ", zipcode);
        console.log("State: ", state);
        console.log("Phone: ", phone);
        console.log("addressId: ", addressId);

        let isValid = true;


        if (firstname === '') {
            $('#edit-firstname-error').text('Please enter your first name.').show();
            isValid = false;
        } else if (!/^[a-zA-Z\s.-]+$/.test(firstname)) {
            $('#edit-firstname-error').text('Avoid invalid characters in the first name').show();
            isValid = false;
        } else {
            $('#edit-firstname-error').hide();
        }

        if (lastname === '') {
            $('#edit-lastname-error').text('Please enter your last name.').show();
            isValid = false;
        } else if (!/^[a-zA-Z\s.-]+$/.test(lastname)) {
            $('#edit-lastname-error').text('Avoid invalid characters in the last name').show();
            isValid = false;
        } else {
            $('#edit-lastname-error').hide();
        }


        if (address === '') {
            $('#edit-address-error').text('Address is required.').show();
            isValid = false;
        } else {
            $('#edit-address-error').hide();
        }

        if (city === '') {
            $('#edit-city-error').text('City is required.').show();
            isValid = false;
        } else {
            $('#edit-city-error').hide();
        }

        if (zipcode === '') {
            $('#edit-pincode-error').text('Zipcode is required.').show();
            isValid = false;
        } else if (!/^\d{6}$/.test(zipcode)) {
            $('#edit-pincode-error').text('Enter a valid 6-digit zipcode.').show();
            isValid = false;
        } else {
            $('#edit-pincode-error').hide();
        }


        if (phone === '') {
            $('#edit-phone-error').text('Phone number is required.').show();
            isValid = false;
        } else if (!/^\d{10}$/.test(phone)) {
            $('#edit-phone-error').text('Enter a valid 10-digit phone number.').show();
            isValid = false;
        } else {
            $('#edit-phone-error').hide();
        }


        // Check if the selected state matches exactly (spelling mistakes in state name)
        let stateExists = false;
        $('#edit-state li').each(function() {
            if (state.toLowerCase() === $(this).data('value').toLowerCase()) {
                stateExists = true;
                return false; // break the loop
                $('.dropdown-list').hide();
            }
        });

        if (!stateExists) {
            $('#edit-state-error').text('Select a valid state from the list.').show();
            isValid = false;
        } else {
            $('#edit-state-error').hide();
        }


        if (isValid) { 
            const formData = {
                addressId,
                firstname,
                lastname,
                address,
                city,
                zipcode,
                state,
                phone,
                // ship_to_another_address: $('#billform-dirrentswitch').is(':checked')
            };



            // AJAX request for EDITING address
            $.ajax({
                type: 'PATCH',
                url: '/edit-address',
                data: formData,
                dataType: 'json',
                success: function(response) {
                    console.log('Response after sending address:', response);
                    if(response.success){
                        Swal.fire({
                            text: "Address has been modified.",
                            icon: 'success',
                            showConfirmButton: false,
                            timer: 1500
                        })
                        .then(() => {
                            location.reload();
                        });
                    }
                },
                error: function(error) {
                    console.error('Error:', error);
                }
            });
        }
    });
});
