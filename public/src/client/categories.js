define('forum/categories', ['categorySelector', 'api', 'bootbox', 'translator', 'alerts', 'benchpress'], function (categorySelector, api, bootbox, translator, alerts, benchpress) {
	const categories = {};

	function bindPurgeHandlers() {
		// Use a selector that matches any purge button with a data-cid attribute
		// so handlers work both on public category listings and admin/manage pages.
		const selector = '[data-action="purge"][data-cid]';

		// Always bind a delegated handler (idempotent) so admin/manage pages
		// and category index both have working buttons. Server-side rendering
		// already controls whether the button should be present for the user.
		$('body').off('click.purge').on('click.purge', selector, function (e) {
			e.preventDefault();
			const $btn = $(this);
			// Support multiple DOM structures: prefer the closest li with data-cid
			// (admin rows use <li data-cid="...">) but fall back to button attr.
			const $li = $btn.closest('li[data-cid]');
			const cid = $btn.attr('data-cid') || ($li.length && $li.attr('data-cid'));
			const name = ($li.length && $li.find('.title').text().trim()) || '';

			// Fetch current topic count then render the same admin modal and perform purge.
			api.get(`/categories/${encodeURIComponent(cid)}/count`).then(function (res) {
				const topicCount = (res && res.count) ? res.count : 0;

				benchpress.render('admin/partials/categories/purge', { name: name, topic_count: topicCount }).then(function (html) {
					const modal = bootbox.dialog({
						title: '[[admin/manage/categories:purge]]',
						message: html,
						size: 'large',
						buttons: {
							save: {
								label: '[[modules:bootbox.confirm]]',
								className: 'btn-primary',
								callback: function () {
									modal.find('.modal-footer button').prop('disabled', true);

									const intervalId = setInterval(async function () {
										try {
											const { count } = await api.get(`/categories/${encodeURIComponent(cid)}/count`);
											let percent = 0;
											if (topicCount > 0) percent = Math.max(0, (1 - (count / topicCount))) * 100;
											modal.find('.progress-bar').css({ width: percent + '%' });
										} catch (err) {
											clearInterval(intervalId);
											alerts.error(err);
										}
									}, 1000);

									api.del('/categories/' + cid).then(function () {
										if (intervalId) clearInterval(intervalId);
										modal.modal('hide');
										alerts.success('[[admin/manage/categories:alert.purge-success]]');
										$li.remove();
									}).catch(function (err) {
										clearInterval(intervalId);
										alerts.error(err);
									});

									return false;
								},
							},
						},
					});
				}).catch(alerts.error);
			}).catch(alerts.error);
		});
	}

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

		// Bind purge handlers for index items
		try { bindPurgeHandlers(); } catch (e) { console.error('bindPurgeHandlers error', e); }
	};

	return categories;
});