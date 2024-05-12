const User = require('../models/userModel');
const Category = require ('../models/categoryModel');



// load category page ------------------------------------------
const loadCategory = async(req, res)=>{
    try {
        console.log('req session in load category : ', req.session);
        const adminData = await User.findOne({_id: req.session.adminId});
        const categoryData = await Category.find({});
        // console.log('category data is : ', categoryData);

        res.render('categoryList', {adminData, categoryData});

    } catch (error) {
        console.log('failed to load category page', error.message);
    }
}



// add new category ---------------------------------------------------
const addCategory = async(req, res)=>{
    try {
        const body = req.body
        console.log('category body is : ', body);

        const existCategory = await Category.findOne({name: req.body.categoryName});
        console.log('exist category ? : ', existCategory);

        if (existCategory) {
            res.json({exists: true, message: "This category already exists. Please create a different one."})
        } else {
            // const isBlocked = req.body.categoryStatus === "block";

            const category = new Category({
                name : req.body.categoryName,
                description : req.body.categoryDescription,
                isListed : true
            });

            const categoryData = await category.save();

            if (categoryData){
                res.json({success: true});
            } else{
                res.status(400).json({failed: true, message: "Failed to create new category."});
            }
        }

    } catch (error) {
        console.log('adding category failed : ', error.message);
    }
}




// load edit category ---------------------------------------------
// const loadEditCategory = async(req, res)=>{
//     try {
//         console.log(req.query.id);
//         const categoryData = await Category.findOne({_id: req.query.id});
//         console.log('finded category data when loading the edit modal :', categoryData);

//     } catch (error) {
//         console.log('failed loading edit category');
//     }
// }




// edit category ---------------------------------------------------
const updateCategory = async(req, res)=>{
    try {
        const {categoryId, categoryName, categoryDescription, categoryStatus} = req.body;
        console.log('requested category to edit is :', categoryId);

        const existCategory = await Category.findOne({ _id: { $ne: categoryId }, name: categoryName });
        console.log('existCategory : ', existCategory);

        if (existCategory) {
            console.log('category name is existing.');
            return res.json({exists: true, message: "Cannot modify category. This category name already exists. Choose a different name."})
        } else {
            // const isBlocked = categoryStatus === "block";
            const isListed = categoryStatus === "list";
            console.log('isListed is: ', isListed);
            // const false = categoryStatus === "list";

            const updatedData = await Category.findOneAndUpdate({_id: categoryId}, {name: categoryName, description: categoryDescription, isListed: isListed});
            console.log('updated category details :', updatedData);
    
            return res.status(200).json({success: true});
        }


    } catch (error) {
        console.log('error in editing category', error.message);
    }
}



module.exports = {
    loadCategory,
    addCategory,
    // loadEditCategory,
    updateCategory
}
