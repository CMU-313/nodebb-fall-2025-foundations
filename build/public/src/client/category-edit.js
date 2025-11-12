//COPILOT and CHATGPT
'use strict';

define('forum/category-edit', [
	'bootbox',
	'api',
	'alerts',
	'translator',
], function (bootbox, api, alerts, translator) {
	const CategoryEdit = {};

	CategoryEdit.init = function () {
		// Handle edit category button clicks
		$(document).on('click', '.edit-category-btn', function (e) {
			e.preventDefault();
			e.stopPropagation();
			
			const $btn = $(this);
			const cid = $btn.data('cid');
			const name = $btn.data('name') || '';
			
			CategoryEdit.showEditModal(cid, name);
		});
	};

	CategoryEdit.showEditModal = function (cid, name) {
		bootbox.dialog({
			title: 'Edit Category',
			message: `
				<form id="edit-category-form">
					<div class="mb-3">
						<label for="category-name" class="form-label">Category Name</label>
						<input type="text" class="form-control" id="category-name" name="name" value="${translator.escape(name)}" required>
					</div>
				</form>
			`,
			buttons: {
				cancel: {
					label: 'Cancel',
					className: 'btn-secondary',
				},
				save: {
					label: 'Save Changes',
					className: 'btn-primary',
					callback: function () {
						const form = document.getElementById('edit-category-form');
						const formData = new FormData(form);
						const name = formData.get('name');
						
						// Client-side validation
						const validationError = CategoryEdit.validateCategoryName(name);
						if (validationError) {
							alerts.alert({
								type: 'danger',
								title: 'Invalid Category Name',
								message: validationError,
								timeout: 5000,
							});
							return false; // Keep modal open
						}
						
						const data = { name: name };
						CategoryEdit.updateCategory(cid, data);
						return false; // Keep modal open
					},
				},
			},
		});
	};
	//CHATGPT
	CategoryEdit.validateCategoryName = function (name) {
		// Empty/null check
		if (!name || name.trim() === '') {
			return 'Category name cannot be empty.';
		}
		
		// Type check (should be string)
		if (typeof name !== 'string') {
			return 'Category name must be text.';
		}
		
		// Length check
		if (name.length > 50) {
			return 'Category name cannot be longer than 50 characters.';
		}
		
		// Invalid characters check
		if (name.includes('/') || name.includes(':')) {
			return 'Category name cannot contain "/" or ":" characters.';
		}
		
		// Check for duplicate names (client-side check)
		const existingNames = [];
		$('.edit-category-btn').each(function () {
			const existingName = $(this).data('name');
			if (existingName && existingName.toLowerCase() === name.toLowerCase()) {
				existingNames.push(existingName);
			}
		});
		
		if (existingNames.length > 0) {
			return 'A category with this name already exists.';
		}
		
		return null; // No validation errors
	};

	CategoryEdit.updateCategory = function (cid, data) {
		api.put(`/categories/${cid}`, data)
			.then(function () {
				alerts.alert({
					type: 'success',
					title: 'Success',
					message: 'Category updated successfully!',
					timeout: 3000,
				});
				
				// Close the modal
				$('.bootbox').modal('hide');
				
				// Update the button's data attribute to reflect the new name
				const $btn = $(`.edit-category-btn[data-cid="${cid}"]`);
				$btn.data('name', data.name);
				
				// Update the displayed category name in the UI
				const $categoryItem = $btn.closest('[component="categories/category"]');
				const $categoryTitle = $categoryItem.find('.title');
				
				if ($categoryTitle.length) {
					// Check if it's a section (just text) or a link
					const $link = $categoryTitle.find('a');
					if ($link.length) {
						// It's a link, update the link text
						$link.text(data.name);
					} else {
						// It's just text, update the title text
						$categoryTitle.text(data.name);
					}
				}
				
				// Also update the meta tag if it exists
				const $metaName = $categoryItem.find('meta[itemprop="name"]');
				if ($metaName.length) {
					$metaName.attr('content', data.name);
				}
			})
			.catch(function (err) {
				alerts.alert({
					type: 'danger',
					title: 'Error',
					message: err.message || 'Failed to update category',
					timeout: 5000,
				});
			});
	};

	return CategoryEdit;
});
