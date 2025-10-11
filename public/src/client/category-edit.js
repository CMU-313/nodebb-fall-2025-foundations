//COPILOT
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
						
						const data = {
							name: formData.get('name'),
						};
						
						CategoryEdit.updateCategory(cid, data);
						return false; // Keep modal open
					},
				},
			},
		});
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
				
				// Refresh the page to show updated data
				ajaxify.refresh();
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
