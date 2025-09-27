define('forum/categories', ['categorySelector', 'api', 'bootbox', 'translator'], function (categorySelector, api, bootbox, translator) {
    const categories = {};

    categories.init = function () {
        app.enterRoom('categories');

        categorySelector.init($('[component="category-selector"]'), {
            privilege: 'find',
            onSelect: function (category) {
                ajaxify.go('/category/' + category.cid);
            },
        });

        const btn = $('#btn-new-category');
        if (!btn.length) return;
//COPILOT
        btn.on('click', function () {
            bootbox.prompt({
                title: translator.translate('[[categories:create-prompt]]') || 'Enter category name:',
                callback: function (categoryName) {
                    if (!categoryName) return;

    
                }
            });
        });
    };

    return categories;
});