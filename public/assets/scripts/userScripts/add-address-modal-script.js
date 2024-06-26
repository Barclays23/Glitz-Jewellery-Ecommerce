// <!-- script for add address modal -->

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
    $('#state-input').on('input', function() {
        const inputValue = $(this).val().toLowerCase();
        $('#add-state li').each(function() {
            const state = $(this).data('value').toLowerCase();
            if (state.startsWith(inputValue)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
        $('.dropdown-list').show();
    });

    
    // Handle selection of state from dropdown list
    $('#add-state li').on('click', function() {
        const selectedState = $(this).data('value');
        $('#state-input').val(selectedState);
        $('.dropdown-list').hide(); // Hide the dropdown list after selection
    });


    $('#saveChanges').on('click', function(event) {
        event.preventDefault();

        const firstname = $('#add-firstname').val()
        const lastname = $('#add-lastname').val()
        const address = $('#add-address').val()
        const city = $('#add-city').val()
        const zipcode = $('#add-pincode').val()
        const state = $('#state-input').val().trim()
        const phone = $('#add-phone').val()

        console.log("Firstname: ", firstname);
        console.log("Lastname: ", lastname);
        console.log("Address: ", address);
        console.log("City: ", city);
        console.log("Pincode: ", zipcode);
        console.log("State: ", state);
        console.log("Phone: ", phone);

        let isValid = true;


        if (firstname === '') {
            $('#firstname-error').text('Please enter your first name.').show();
            isValid = false;
        } else if (!/^[a-zA-Z\s.-]+$/.test(firstname)) {
            $('#firstname-error').text('Avoid invalid characters in the first name').show();
            isValid = false;
        } else {
            $('#firstname-error').hide();
        }

        if (lastname === '') {
            $('#lastname-error').text('Please enter your last name.').show();
            isValid = false;
        } else if (!/^[a-zA-Z\s.-]+$/.test(lastname)) {
            $('#lastname-error').text('Avoid invalid characters in the last name').show();
            isValid = false;
        } else {
            $('#lastname-error').hide();
        }


        if (address === '') {
            $('#address-error').text('Address is required.').show();
            isValid = false;
        } else {
            $('#address-error').hide();
        }

        if (city === '') {
            $('#city-error').text('City is required.').show();
            isValid = false;
        } else {
            $('#city-error').hide();
        }

        if (zipcode === '') {
            $('#pincode-error').text('Zipcode is required.').show();
            isValid = false;
        } else if (!/^\d{6}$/.test(zipcode)) {
            $('#pincode-error').text('Enter a valid 6-digit zipcode.').show();
            isValid = false;
        } else {
            $('#pincode-error').hide();
        }


        if (phone === '') {
            $('#phone-error').text('Phone number is required.').show();
            isValid = false;
        } else if (!/^\d{10}$/.test(phone)) {
            $('#phone-error').text('Enter a valid 10-digit phone number.').show();
            isValid = false;
        } else {
            $('#phone-error').hide();
        }


        // Check if the selected state matches exactly (spelling mistakes in state name)
        let stateExists = false;
        $('#add-state li').each(function() {
            if (state.toLowerCase() === $(this).data('value').toLowerCase()) {
                stateExists = true;
                $('.dropdown-list').hide();
                return false; // break the loop
            }
        });

        if (!stateExists) {
            $('#state-error').text('Select a valid state from the list.').show();
            isValid = false;
        } else {
            $('#state-error').hide();
        }


        if (isValid) { 
            const formData = {
                firstname,
                lastname,
                address,
                city,
                zipcode,
                state,
                phone,
                // ship_to_another_address: $('#billform-dirrentswitch').is(':checked')
            };

            $.ajax({
                type: 'POST',
                url: '/add-address',
                data: formData,
                dataType: 'json',
                success: function(response) {
                    console.log('Response after sending address:', response);
                    if(response.success){
                        Swal.fire({
                            text: "New address has been added.",
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
