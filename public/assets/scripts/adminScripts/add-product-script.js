// <!--script for ADD PRODUCTS FORM submission -->

// to fill the net weight automatically.
function calculateNetWeight() {
    const grossWt = document.getElementById('add-product-gross-wt').value;
    const stoneWt = document.getElementById('add-product-stone-wt').value;
    const netWt = grossWt - stoneWt;
    document.getElementById('add-product-net-wt').value = netWt.toFixed(3);
}

// to enable/disble the stone charge field
function toggleStoneChargeField() {
    const stoneWt = parseFloat(document.getElementById('add-product-stone-wt').value) || 0;
    const stoneChargeField = document.getElementById('add-product-sc');
    
    if (!stoneWt || stoneWt === "") {
        stoneChargeField.disabled = true;
        stoneChargeField.value = 0;
    } else {
        stoneChargeField.disabled = false;
    }
}

document.getElementById('add-product-gross-wt').addEventListener('input', calculateNetWeight);
document.getElementById('add-product-stone-wt').addEventListener('input', calculateNetWeight);
document.getElementById('add-product-stone-wt').addEventListener('input', toggleStoneChargeField);



// to show the preview of the images inserted.
function previewImages(event) {
    const files = event.target.files;
    const imagePreviews = document.getElementById('add-image-previews');
    const maxImages = 4;
    const minImages = 4;
    const selectedImages = [];

    const fileUploadError = document.getElementById('file-upload-error');


    if (files.length > maxImages) {
        fileUploadError.textContent = "You can only upload a maximum of " + maxImages + " images. Please remove any excess images";
        fileUploadError.style.display = "block";
        isValid = false;
    } else if(files.length < minImages){
        fileUploadError.textContent = "Please upload a minimum of " + minImages + " images.";
        fileUploadError.style.display = "block";
        isValid = false;
    } else{
        fileUploadError.style.display = "none";
    }

    imagePreviews.innerHTML = '';

    Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        const imgContainer = document.createElement('div'); // Container for image and remove button
        const img = document.createElement('img');
        const removeBtn = document.createElement('button');

        img.style.maxWidth = '100px';
        img.style.margin = '10px';

        removeBtn.textContent = 'Remove'; // Text for remove button
        removeBtn.style.backgroundColor = 'red';
        removeBtn.style.color = 'white';
        removeBtn.onclick = function() {
            imgContainer.remove(); // Remove the image container when remove button is clicked
            selectedImages.splice(index, 1); // Remove corresponding image file from selectedImages array
        };

        reader.onload = function(e) {
            img.src = e.target.result;
        };

        reader.readAsDataURL(file);

        imgContainer.appendChild(img);
        imgContainer.appendChild(removeBtn);
        imagePreviews.appendChild(imgContainer);

        selectedImages.push(file); // Add the file to selectedImages array
    });
}
const fileInput = document.getElementById('edit-product-images');
// fileInput.addEventListener('change', previewImages);


// for validating and submitting add product form
$(document).ready(function() {
    $('#saveProductBtn').click(function(event) {
        event.preventDefault();


        const productImages = $('#add-product-images')[0].files;
        const productCategory = $('#add-product-category').val();
        const productName = $('#add-product-name').val();
        const productDescription = $('#add-product-description').val();
        const productGrossWt = parseFloat($('#add-product-gross-wt').val()) || 0;
        const productStoneWt = parseFloat($('#add-product-stone-wt').val()) || 0;
        const productNetWt = parseFloat($('#add-product-net-wt').val()) || 0;
        const productMc = parseFloat($('#add-product-mc').val()) || 0;
        const productSc = parseFloat($('#add-product-sc').val()) || 0;
        const productPurity = $('#add-product-purity').val();
        // const productQty = parseInt($('#add-product-quantity').val()) || 0;
        const productQty = $('#add-product-quantity').val().trim();
        const productStatus = $('#add-product-status').val();

        console.log("Product Category : ", productCategory);
        console.log("Product Name : ", productName);
        console.log("Product Description : ", productDescription);
        console.log("Product GrossWt : ", productGrossWt);
        console.log("Product StoneWt : ", productStoneWt);
        console.log("Product NetWt : ", productNetWt);
        console.log("Product Purity : ", productPurity);
        console.log("Product MC : ", productMc);
        console.log("Product SC : ", productSc);
        console.log('type of stoneCharge : ', typeof(productSc));
        console.log("Product Qty : ", productQty);
        console.log("Product Status : ", productStatus);


        const addProductImagesError = document.getElementById('add-product-images-error');
        const choosenFileError = document.getElementById('choosen-file-error');
        const addProductCategoryError = document.getElementById('add-product-category-error');
        const addProductNameError = document.getElementById('add-product-name-error');
        const addProductDescriptionError = document.getElementById('add-product-description-error');
        const addProductGrossWtError = document.getElementById('add-product-gross-wt-error');
        const addProductStoneWtError = document.getElementById('add-product-stone-wt-error');
        const addProductNetWtError = document.getElementById('add-product-net-wt-error');
        const addProductMcError = document.getElementById('add-product-mc-error');
        const addProductScError = document.getElementById('add-product-sc-error');
        const addProductQtyError = document.getElementById('add-product-quantity-error');

        addProductImagesError.style.display = "none";
        addProductCategoryError.style.display = "none";
        addProductNameError.style.display = "none";
        addProductDescriptionError.style.display = "none";
        addProductGrossWtError.style.display = "none";
        addProductStoneWtError.style.display = "none";
        addProductNetWtError.style.display = "none";
        addProductMcError.style.display = "none";
        addProductScError.style.display = "none";
        addProductQtyError.style.display = "none";


        let isValid = true;


        var allowedFormats = ["jpg", "jpeg", "png", "gif", "webp"]; // Add more formats if needed
        if (productImages.length === 0) {
            addProductImagesError.textContent = "Please choose image files to proceed.";
            addProductImagesError.style.display = "block";
            isValid = false;
        } else {
            for (const file of productImages) {
                const fileExtension = file.name.split('.').pop().toLowerCase();
                if (!allowedFormats.includes(fileExtension)) {
                    addProductImagesError.textContent = "Please select files in JPG, PNG, GIF, or another supported image format.";
                    addProductImagesError.style.display = "block";
                    isValid = false;
                    break;
                }
            }
        }
        
        
        if (productCategory === "select-category") {
            addProductCategoryError.textContent = "Select product category.";
            addProductCategoryError.style.display = "block";
            isValid = false;
        } else {
            addProductCategoryError.style.display = "none";
        }

        if (productName === "") {
            addProductNameError.textContent = "Product name is required.";
            addProductNameError.style.display = "block";
            isValid = false;
        } else if (!/[a-zA-Z0-9]/.test(productName)){
            addProductNameError.textContent = "Name cannot be blank.";
            addProductNameError.style.display = "block";
            isValid = false;
        } else {
            addProductNameError.style.display = "none";
        }

        if (productDescription === "") {
            addProductDescriptionError.textContent = "Description is required.";
            addProductDescriptionError.style.display = "block";
            isValid = false;
        } else if (!/[a-zA-Z0-9]/.test(productDescription)){
            addProductDescriptionError.textContent = "Description cannot be blank.";
            addProductDescriptionError.style.display = "block";
            isValid = false;
        } else {
            addProductDescriptionError.style.display = "none";
        }


        if (!productGrossWt) {
            addProductGrossWtError.textContent = "Gross weight is required.";
            addProductGrossWtError.style.display = "block";
            isValid = false;
        } else if (productGrossWt < 0){
            addProductGrossWtError.textContent = "Gross weight must be greater than 0.";
            addProductGrossWtError.style.display = "block";
            isValid = false;
        } else if (!/^\d+(\.\d+)?$/.test(productGrossWt)) {
            addProductGrossWtError.textContent = "Enter a valid weight (numbers only).";
            addProductGrossWtError.style.display = "block";
            isValid = false;
        } else {
            addProductGrossWtError.style.display = "none";
        }


        if (productStoneWt < 0) {
            addProductStoneWtError.textContent = "Stone weight must be greater than or equal to 0.";
            addProductStoneWtError.style.display = "block";
            isValid = false;
        }if (productStoneWt > productGrossWt) {
            addProductStoneWtError.textContent = "Stone weight must be less than gross weight.";
            addProductStoneWtError.style.display = "block";
            isValid = false;
        } else if (!/^\d+(\.\d+)?$/.test(productStoneWt)){
            addProductStoneWtError.textContent = "Enter a valid weight (numbers only).";
            addProductStoneWtError.style.display = "block";
            isValid = false;
        } else {
            addProductStoneWtError.style.display = "none";
        }


        if (!productNetWt) {
            addProductNetWtError.textContent = "Net weight is required.";
            addProductNetWtError.style.display = "block";
            isValid = false;
        } else if (productNetWt < 0){
            addProductNetWtError.textContent = " negative value";
            addProductNetWtError.style.display = "block";
            isValid = false;
        } else if (!/^\d+(\.\d+)?$/.test(productNetWt)) {
            addProductNetWtError.textContent = "Enter a valid weight (numbers only).";
            addProductNetWtError.style.display = "block";
            isValid = false;
        } else {
            addProductNetWtError.style.display = "none";
        }


        if (!productMc) {
            addProductMcError.textContent = "Making Charge is required.";
            addProductMcError.style.display = "block";
            isValid = false;
        } else if(productMc <= 0){
            addProductMcError.textContent = "Making charge must be greater than 0.";
            addProductMcError.style.display = "block";
            isValid = false;
        }else if (!/^\d+(\.\d+)?$/.test(productMc)) {
            addProductMcError.textContent = "Enter a valid MC (numbers only).";
            addProductMcError.style.display = "block";
            isValid = false;
        } else {
            addProductMcError.style.display = "none";
        }



        if (productStoneWt > 0 && !productSc) {
            addProductScError.textContent = "Stone charge is required.";
            addProductScError.style.display = "block";
            isValid = false;
        } else if (productStoneWt > 0 && productSc <= 0) {
            addProductScError.textContent = "Stone charge must be greater than 0.";
            addProductScError.style.display = "block";
            isValid = false;
        } else if (!productStoneWt && productSc > 0) {
            addProductScError.textContent = "Cannot enter stone rate for stoneless ornaments.";
            addProductScError.style.display = "block";
            isValid = false;
        } else if (!/^\d+(\.\d+)?$/.test(productSc)) {
            addProductScError.textContent = "Enter a valid service charge (numbers only).";
            addProductScError.style.display = "block";
            isValid = false;
        } else {
            addProductScError.style.display = "none";
        }
        


        if (productQty === "") {
            addProductQtyError.textContent = "Quantity is required.";
            addProductQtyError.style.display = "block";
            isValid = false;
        } else if (!/^[-+]?\d+$/.test(productQty)) {
            addProductQtyError.textContent = "Enter a valid quantity (numbers only).";
            addProductQtyError.style.display = "block";
            isValid = false;
        } else {
            const parsedQty = parseInt(productQty, 10); // Parse the trimmed input as an integer
            if (parsedQty < 0) {
                addProductQtyError.textContent = "Quantity cannot be a negative value.";
                addProductQtyError.style.display = "block";
                isValid = false;
            } else {
                addProductQtyError.style.display = "none";
            }
        }
        


        if(!isValid){
            return;
        }

        const formData = new FormData();
        for (let i = 0; i < productImages.length; i++) {
            formData.append(`croppedImages`, productImages[i]);
        }

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

        console.log('formData is: ', formData);

        $.ajax({
            url: '/admin/add-product',
            method: 'POST',
            // contentType: 'application/json',
            data: formData,
            processData: false,
            contentType: false, // Don't set contentType when using FormData
            success: function(response) {
                console.log('Add Product Form submitted');

                if(response.success){
                    Swal.fire({
                        icon: "success",
                        title: "Success",
                        text : "New Product Added Successfully!",
                    })
                    .then(location.reload())

                } 
                // else if(response.exists){
                //     addProductCodeError.textContent = response.message;
                //     addProductCodeError.style.display = "block";
                // }

                $('#addProductModal').modal('hide');
            },
            error: function(xhr, status, error) {
                console.error('Error submitting form:', error);
            }
        });
    });
});










// ERROR IN SHOWING THE DEFAULT VALUES IN FORM FIELDS
// Why This Matters:
// HTML attribute names are generally case-insensitive, but when accessed via JavaScript, they become case-sensitive.
// jQuery's .data() method converts the attribute names to lowercase internally, so you need to access them using lowercase names in JavaScript.
// Example:
// HTML: <a data-grossWeight="value"> should be <a data-grossweight="value">.
// JavaScript: $(this).data('grossweight') to access data-grossweight.