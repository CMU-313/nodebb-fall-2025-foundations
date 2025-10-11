define('forum/categories', ['categorySelector', 'api', 'bootbox', 'translator', 'forum/category-edit'], function (categorySelector, api, bootbox, translator, categoryEdit) {
	const categories = {};

	categories.init = function () {
		app.enterRoom('categories');

		categorySelector.init($('[component="category-selector"]'), {
			privilege: 'find',
			onSelect: function (category) {
				ajaxify.go('/category/' + category.cid);
			},
		});

		// Initialize category edit functionality
		categoryEdit.init();

		const btn = $('#btn-new-category');
		if (!btn.length) return;
		//COPILOT
		btn.on('click', function () {
			bootbox.prompt({
				title: translator.translate('[[categories:create-prompt]]') || 'Enter category name:',
				callback: function (categoryName) {
					if (!categoryName) return;

					api.post('/categories', { name: categoryName }).then(res => {
						bootbox.alert(`Category "${res.name}" created!`, function () {
							ajaxify.refresh();
						});
					}).catch(err => {
						bootbox.alert(`Error creating category: ${err.message || err}`);
					});
    
				},
			});
		});
	};

	return categories;
});