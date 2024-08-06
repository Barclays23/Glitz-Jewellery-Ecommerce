// <!-- SCRIPT FOR EDIT PRODUCTS FORM SUBMISSION -->

    // to fill the net weight automatically.
    function calculateNetWeight() {
        const grossWt = document.getElementById('edit-product-gross-wt').value;
        const stoneWt = document.getElementById('edit-product-stone-wt').value;
        const netWt = grossWt - stoneWt;
        document.getElementById('edit-product-net-wt').value = netWt.toFixed(3);
    }

    // to enable/disble the stone charge field
    function toggleStoneChargeField() {
        const stoneWt = parseFloat(document.getElementById('edit-product-stone-wt').value) || 0;
        const stoneChargeField = document.getElementById('edit-product-sc');
        if (!stoneWt || stoneWt === "") {
            stoneChargeField.disabled = true;
            stoneChargeField.value = 0;
        } else {
            stoneChargeField.disabled = false;
        }
    }

    document.getElementById('edit-product-gross-wt').addEventListener('input', calculateNetWeight);
    document.getElementById('edit-product-stone-wt').addEventListener('input', calculateNetWeight);
    document.getElementById('edit-product-stone-wt').addEventListener('input', toggleStoneChargeField);



    // Function to handle image preview and remove button
    $(document).ready(function () {
        const imagePreviews = ['edit-image-preview1', 'edit-image-preview2', 'edit-image-preview3', 'edit-image-preview4'];
        const imageInputs = ['edit-product-image1', 'edit-product-image2', 'edit-product-image3', 'edit-product-image4'];
        const replacedImages = [];
        let existingImages = [];


        // Function to add image preview with remove button
        function addImagePreview(imageUrl, index, fileName, isExisting = false, imageName = "") {
            const imgContainer = $('<div>').css('position', 'relative').css('display', 'flex').css('align-items', 'center');
            const img = $('<img>').attr('src', imageUrl).css('maxWidth', '100px').css('margin', '10px').css('border', '1px solid white');
            const fileNameElement = $('<p>').text(fileName).css('margin', '0').css('marginLeft', '5px');
            
            imgContainer.append(img);
            imgContainer.append(fileNameElement);

            $('#' + imagePreviews[index]).html(imgContainer);

            // if (isExisting) {
            //     existingImages[index] = fileName; // Keep track of existing images
            //     console.log(existingImages[index]);
            // } else {
            //     replacedImages[index] = fileName; // Keep track of new images
            //     console.log(replacedImages[index]);
            // } 
        }

        // Event listener for file input change (for inserted images)
        imageInputs.forEach((inputId, index) => {
            const inputElement = document.getElementById(inputId);
            
            if (inputElement) {
                inputElement.addEventListener('change', function () {
                    const file = this.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function (e) {
                            addImagePreview(e.target.result, index, file.name);
                            replacedImages[index] = file;
                        }
                        reader.readAsDataURL(file);
                    }
                });
            }
        });



        // set the default values in the edit product form fields (including images)
        $(document).ready(function () {
            $('a[data-target="#editProductModal"]').click(function () {
                // Retrieve data attributes from <a> tag (.data attibutes must be in small letter. eg: makingcharge, grossweight etc)
                var productId = $(this).data('id');
                var productImages = $(this).data('images'); //array
                var productCategory = $(this).data('category');
                var productCode = $(this).data('code');
                var productName = $(this).data('name');
                var productDescription = $(this).data('description');
                var productGrossWeight = $(this).data('grossweight');
                var productStoneWeight = $(this).data('stoneweight');
                var productNetWeight = $(this).data('netweight');
                var productMc = $(this).data('makingcharge');
                var productSc = $(this).data('stonecharge');
                var productPurity = $(this).data('purity');
                var productQty = $(this).data('quantity');
                var productStatus = $(this).data('islisted');

                console.log("Default productImages A : ", productImages[1]);


                // Set the default values in the form fields.
                $('#edit-product-id').val(productId);
                $('#edit-product-code').val(productCode);
                $('#edit-product-category').val(productCategory);
                $('#edit-product-name').val(productName);
                $('#edit-product-description').val(productDescription);
                $('#edit-product-gross-wt').val(productGrossWeight);
                $('#edit-product-stone-wt').val(productStoneWeight);
                $('#edit-product-net-wt').val(productNetWeight);
                $('#edit-product-mc').val(productMc);
                $('#edit-product-sc').val(productSc);
                $('#edit-product-purity').val(productPurity);
                $('#edit-product-quantity').val(productQty);
                $('#edit-product-status').val(productStatus ? 'unlist' : 'list');

                // Clear previous images
                imagePreviews.forEach(preview => $('#' + preview).html(''));
                replacedImages.length = 0;
                existingImages.length = 0;

                // Display default images
                if (productImages) {
                    productImages.forEach((imageUrl, index) => {
                        addImagePreview('/assets/images/productImages/' + imageUrl, index, imageUrl, true, imageUrl);
                    });
                }

                console.log("Default ProductId : ", productId);
                console.log("Default productImages B : ", productImages);
                console.log("Default ProductCategory : ", productCategory);
                console.log("Default ProductCode : ", productCode);
                console.log("Default ProductName : ", productName);
                console.log("Default ProductDescription : ", productDescription);
                console.log("Default ProductGrossWt : ", productGrossWeight);
                console.log("Default ProductStoneWt : ", productStoneWeight);
                console.log("Default ProductNetWt : ", productNetWeight);
                console.log("Default ProductMC : ", productMc);
                console.log("Default ProductSC : ", productSc);
                console.log("Default ProductPurity : ", productPurity);
                console.log("Default ProductQty : ", productQty);
                console.log("Default ProductStatus : ", productStatus);
            });
        });



        //for validating and submitting the edit form
        $('#updateProductBtn').click(function () {
            console.log('updateProductBtn function started execute' );

            // Retrieve updated values from modal fields
            const productId = $('#edit-product-id').val();
            // const productImages = $('#edit-product-images');
            // const productImages = $('#edit-product-image1');
            const existingImages = $('#edit-image-previews').children().length;
            const productCategory = $('#edit-product-category').val();
            const productCode = $('#edit-product-code').val();
            const productName = $('#edit-product-name').val();
            const productDescription = $('#edit-product-description').val();
            const productGrossWt = parseFloat($('#edit-product-gross-wt').val()) || 0;
            const productStoneWt = parseFloat($('#edit-product-stone-wt').val()) || 0;
            const productNetWt = parseFloat($('#edit-product-net-wt').val()) || 0;
            const productMc = parseFloat($('#edit-product-mc').val()) || 0;
            const productSc = parseFloat($('#edit-product-sc').val()) || 0;
            const productPurity = $('#edit-product-purity').val();
            // const productQty = parseInt($('#edit-product-quantity').val()) || 0;
            const productQty = $('#edit-product-quantity').val().trim();
            const productStatus = $('#edit-product-status').val();


            console.log("Current ProductId : ", productId);
            // console.log("Current productImages : ", productImages);
            console.log("Current existingImages : ", existingImages);
            console.log("Current ProductCategory : ", productCategory);
            console.log("Current ProductCode : ", productCode);
            console.log("Current ProductName : ", productName);
            console.log("Current ProductDescription : ", productDescription);
            console.log("Current productGrossWeight : ", productGrossWt);
            console.log("Current productStoneWeight : ", productStoneWt);
            console.log("Current productNetWeight : ", productNetWt);
            console.log("Current ProductMc : ", productMc);
            console.log("Current ProductSc : ", productSc);
            console.log("Current ProductPurity : ", productPurity);
            console.log("Current ProductQty : ", productQty);
            console.log("Current ProductStatus : ", productStatus);



            const editProductImagesError = document.getElementById('edit-product-images-error');
            const choosenFileError = document.getElementById('choosen-file-error');
            const editProductCategoryError = document.getElementById('edit-product-category-error');
            const editProductNameError = document.getElementById('edit-product-name-error');
            const editProductDescriptionError = document.getElementById('edit-product-description-error');
            const editProductGrossWtError = document.getElementById('edit-product-gross-wt-error');
            const editProductStoneWtError = document.getElementById('edit-product-stone-wt-error');
            const editProductNetWtError = document.getElementById('edit-product-net-wt-error');
            const editProductMcError = document.getElementById('edit-product-mc-error');
            const editProductScError = document.getElementById('edit-product-sc-error');
            const editProductQtyError = document.getElementById('edit-product-quantity-error');

            editProductImagesError.style.display = "none";
            editProductCategoryError.style.display = "none";
            editProductNameError.style.display = "none";
            editProductDescriptionError.style.display = "none";
            editProductGrossWtError.style.display = "none";
            editProductStoneWtError.style.display = "none";
            editProductNetWtError.style.display = "none";
            editProductMcError.style.display = "none";
            editProductScError.style.display = "none";
            editProductQtyError.style.display = "none";


            let isValid = true;

            var allowedFormats = ["jpg", "jpeg", "png", "gif", "webp"]; // Add more formats if needed
            const hasNewImages = replacedImages.some(img => img);


            if (!hasNewImages && existingImages.length === 0) {
                editProductImagesError.textContent = "Please choose image files to proceed.";
                editProductImagesError.style.display = "block";
                isValid = false;
            } else if (hasNewImages) {
                for (const file of replacedImages) {
                    if (file) {
                        const fileExtension = file.name.split('.').pop().toLowerCase();
                        if (!allowedFormats.includes(fileExtension)) {
                            editProductImagesError.textContent = "Please select files in JPG, PNG, GIF, or another supported image format.";
                            editProductImagesError.style.display = "block";
                            isValid = false;
                            break;
                        }
                    }
                }
            }

            if (productCategory === "select-category") {
                editProductCategoryError.textContent = "Select product category.";
                editProductCategoryError.style.display = "block";
                isValid = false;
            } else {
                editProductCategoryError.style.display = "none";
            }

            if (productName === "") {
                editProductNameError.textContent = "Product name is required.";
                editProductNameError.style.display = "block";
                isValid = false;
            } else if (!/[a-zA-Z0-9]/.test(productName)){
                editProductNameError.textContent = "Name cannot be blank.";
                editProductNameError.style.display = "block";
                isValid = false;
            } else {
                editProductNameError.style.display = "none";
            }

            if (productDescription === "") {
                editProductDescriptionError.textContent = "Product description is required.";
                editProductDescriptionError.style.display = "block";
                isValid = false;
            } else if (!/[a-zA-Z0-9]/.test(productDescription)){
                editProductDescriptionError.textContent = "Description cannot be blank.";
                editProductDescriptionError.style.display = "block";
                isValid = false;
            } else {
                editProductDescriptionError.style.display = "none";
            }



            if (!productGrossWt) {
                editProductGrossWtError.textContent = "Gross weight is required.";
                editProductGrossWtError.style.display = "block";
                isValid = false;
            } else if (productGrossWt < 0) {
                editProductGrossWtError.textContent = "Gross weight must be greater than 0.";
                editProductGrossWtError.style.display = "block";
                isValid = false;
            } else if (!/^\d+(\.\d+)?$/.test(productGrossWt)) {
                editProductGrossWtError.textContent = "Enter a valid weight (numbers only).";
                editProductGrossWtError.style.display = "block";
                isValid = false;
            } else {
                editProductGrossWtError.style.display = "none";
            }


            if (productStoneWt < 0) {
                editProductStoneWtError.textContent = "Stone weight must be greater than or equal to 0.";
                editProductStoneWtError.style.display = "block";
                isValid = false;
            } if (productStoneWt > productGrossWt) {
                editProductStoneWtError.textContent = "Stone weight must be less than gross weight.";
                editProductStoneWtError.style.display = "block";
                isValid = false;
            } else if (!/^\d+(\.\d+)?$/.test(productStoneWt)) {
                editProductStoneWtError.textContent = "Enter a valid weight (numbers only).";
                editProductStoneWtError.style.display = "block";
                isValid = false;
            } else {
                editProductStoneWtError.style.display = "none";
            }


            if (!productNetWt) {
                editProductNetWtError.textContent = "Net weight is required.";
                editProductNetWtError.style.display = "block";
                isValid = false;
            } else if (productNetWt < 0) {
                editProductNetWtError.textContent = " negative value";
                editProductNetWtError.style.display = "block";
                isValid = false;
            } else if (!/^\d+(\.\d+)?$/.test(productNetWt)) {
                editProductNetWtError.textContent = "Enter a valid weight (numbers only).";
                editProductNetWtError.style.display = "block";
                isValid = false;
            } else {
                editProductNetWtError.style.display = "none";
            }


            if (!productMc) {
                editProductMcError.textContent = "Making Charge is required.";
                editProductMcError.style.display = "block";
                isValid = false;
            } else if (productMc <= 0) {
                editProductMcError.textContent = "Making charge must be greater than 0.";
                editProductMcError.style.display = "block";
                isValid = false;
            } else if (!/^\d+(\.\d+)?$/.test(productMc)) {
                editProductMcError.textContent = "Enter a valid MC (numbers only).";
                editProductMcError.style.display = "block";
                isValid = false;
            } else {
                editProductMcError.style.display = "none";
            }



            if (productStoneWt > 0 && !productSc) {
                editProductScError.textContent = "Stone charge is required.";
                editProductScError.style.display = "block";
                isValid = false;
            } else if (productStoneWt > 0 && productSc <= 0) {
                editProductScError.textContent = "Stone charge must be greater than 0.";
                editProductScError.style.display = "block";
                isValid = false;
            } else if (!productStoneWt && productSc > 0) {
                editProductScError.textContent = "Cannot enter stone rate for stoneless ornaments.";
                editProductScError.style.display = "block";
                isValid = false;
            } else if (!/^\d+(\.\d+)?$/.test(productSc)) {
                editProductScError.textContent = "Enter a valid service charge (numbers only).";
                editProductScError.style.display = "block";
                isValid = false;
            } else {
                editProductScError.style.display = "none";
            }


            if (productQty === "") {
                editProductQtyError.textContent = "Quantity is required.";
                editProductQtyError.style.display = "block";
                isValid = false;
            } else if (!/^[-+]?\d+$/.test(productQty)) {
                editProductQtyError.textContent = "Enter a valid product quantity (numbers only).";
                editProductQtyError.style.display = "block";
                isValid = false;
            } else {
                const parsedQty = parseInt(productQty, 10); // Parse the trimmed input as an integer
                if (parsedQty < 0) {
                    editProductQtyError.textContent = "Quantity cannot be a negative value.";
                    editProductQtyError.style.display = "block";
                    isValid = false;
                } else {
                    editProductQtyError.style.display = "none";
                }
            }



            if (isValid) {
                const formData = new FormData();

                imageInputs.forEach((inputId, index) => {
                    const inputElement = document.getElementById(inputId);
                    if (inputElement && inputElement.files.length > 0) {
                        formData.append('croppedImages', inputElement.files[0]);
                        formData.append('imageIndex[]', index); // Indicate which image slot this file belongs to
                    } else {
                        // If no new file is selected, check if there's an existing image
                        const existingImage = $('#' + imagePreviews[index] + ' img');
                        if (existingImage.length > 0) {
                            const imageUrl = existingImage.attr('src');
                            const imageName = imageUrl.substring(imageUrl.lastIndexOf('/') + 1); // Extract image name
                            formData.append('existingImages[]', imageName);
                            formData.append('imageIndex[]', index); // Indicate which image slot this existing image belongs to
                        }
                    }
                });

                formData.append('productId', productId);
                formData.append('productCode', productCode);
                formData.append('productCategory', productCategory);
                formData.append('productName', productName);
                formData.append('productDescription', productDescription);
                formData.append('productGrossWt', productGrossWt.toFixed(3));
                formData.append('productStoneWt', productStoneWt.toFixed(3));
                formData.append('productNetWt', productNetWt.toFixed(3));
                formData.append('productMc', productMc);
                formData.append('productSc', productSc.toFixed(2));
                formData.append('productPurity', productPurity);
                formData.append('productQty', productQty);
                formData.append('productStatus', productStatus);


                function logFormData(formData) {
                    for (let [key, value] of formData.entries()) {
                        console.log(key, value);
                    }
                }

                console.log('sending formData is given below.');
                logFormData(formData);



                $.ajax({
                    url: '/admin/edit-product',
                    method: 'PUT',
                    // contentType: 'application/json',
                    contentType: false, // Don't set contentType when using FormData
                    data: formData,
                    processData: false,
                    success: function (response) {
                        console.log('Update Product Form submitted', response);
                        if (response.success) {
                            Swal.fire({
                                icon: "success",
                                title: "Success",
                                text: "Product Updated Successfully!",
                            })
                            .then(location.reload());
                        } else {
                            console.error('Update Product Failed:', response.message);
                        }
                    },
                    error: function (xhr, status, error) {
                        console.error('Error in updating product:', error);
                    }
                });
            }

        });
    });

