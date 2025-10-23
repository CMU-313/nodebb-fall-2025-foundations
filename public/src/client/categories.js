define('forum/categories', ['categorySelector', 'api', 'bootbox', 'translator', 'alerts', 'benchpress', 'forum/category-edit'], function (categorySelector, api, bootbox, translator, alerts, benchpress, categoryEdit) {
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

		// Bind purge handlers for index items
		// ChatGPT
		try { bindPurgeHandlers(); } catch (e) { console.error('bindPurgeHandlers error', e); }

		// Permanent runtime fallback: ensure purge buttons exist for admins/global-mods
		// and re-run on ajaxify navigation. This avoids needing manual console commands.
		function appendPurgeButtonsToDOM() {
			document.querySelectorAll('li[component="categories/category"]').forEach(function (li) {
				if (li.querySelector('[data-action="purge"]')) return;
				const cid = li.getAttribute('data-cid') || li.dataset.cid;
				if (!cid) return;
				const container = li.querySelector('.d-flex.align-items-start.justify-content-end') || li.querySelector('.d-flex.align-items-start') || li;
				const btn = document.createElement('button');
				btn.className = 'btn btn-danger btn-sm ms-2';
				btn.setAttribute('data-action', 'purge');
				btn.setAttribute('data-cid', cid);
				btn.title = '[[admin/manage/categories:purge]]';
				btn.innerHTML = '<i class="fa fa-fw fa-trash"></i>';
				container.appendChild(btn);
			});
		}

		async function ensurePurgeButtonsForAdmin() {
			try {
				// Fast-path: if the global app.user object is present and shows admin/mod
				// privileges, append buttons immediately without waiting for ajaxify.data.
				if (typeof window !== 'undefined' && window.app && app.user) {
					try {
						if (app.user.isAdmin || app.user.isGlobalModerator || app.user.allowPurge) {
							appendPurgeButtonsToDOM();
							return;
						}
					} catch (e) { /* ignore app.user read errors */ }
				}
				// Fast-path: ajaxify data contains authorization flags
				if (typeof ajaxify !== 'undefined' && ajaxify.data) {
					if (ajaxify.data.isAdmin || ajaxify.data.isGlobalModerator || ajaxify.data.allowPurge) {
						appendPurgeButtonsToDOM();
						return;
					}
					// Else try to resolve via API for the logged-in user
					if (ajaxify.data.loggedIn && ajaxify.data.loggedInUser && ajaxify.data.loggedInUser.uid) {
						const uid = ajaxify.data.loggedInUser.uid;
						try {
							const userData = await api.get(`/users/${encodeURIComponent(uid)}`);
							if (userData && (userData.isAdmin || userData.isGlobalModerator || userData.allowPurge)) {
								appendPurgeButtonsToDOM();
							}
						} catch (e) { /* ignore */ }
					}
				}
			} catch (err) {
				console.error('ensurePurgeButtonsForAdmin error', err);
			}
		}

		// Run on init
		try { ensurePurgeButtonsForAdmin(); } catch (e) { console.error('ensurePurgeButtonsForAdmin init error', e); }
		// Small retries: some pages populate ajaxify.data or app.user slightly later
		// — retry a couple times to cover race conditions so buttons show on first visit.
		try { setTimeout(() => { try { ensurePurgeButtonsForAdmin(); } catch (e) {} }, 50); } catch (e) {}
		try { setTimeout(() => { try { ensurePurgeButtonsForAdmin(); } catch (e) {} }, 150); } catch (e) {}

		// Re-run after ajaxify navigation so dynamic page changes get buttons too.
		try {
			$(window).off('action:ajaxify.end.ensurePurge').on('action:ajaxify.end.ensurePurge', function () {
				// Re-bind handlers and ensure buttons exist for the new view
				try { bindPurgeHandlers(); } catch (e) { console.error('bindPurgeHandlers error (ajaxify)', e); }
				try { ensurePurgeButtonsForAdmin(); } catch (e) { console.error('ensurePurgeButtonsForAdmin error (ajaxify)', e); }
			});

			// Also attach to dataLoaded and coldLoad so we catch the very first
			// navigation where ajaxify may populate data before `end` handlers run.
			try {
				$(window).off('action:ajaxify.dataLoaded.ensurePurge').on('action:ajaxify.dataLoaded.ensurePurge', function () {
					try { bindPurgeHandlers(); } catch (e) { console.error('bindPurgeHandlers error (dataLoaded)', e); }
					try { ensurePurgeButtonsForAdmin(); } catch (e) { console.error('ensurePurgeButtonsForAdmin error (dataLoaded)', e); }
				});
				$(window).off('action:ajaxify.coldLoad.ensurePurge').on('action:ajaxify.coldLoad.ensurePurge', function () {
					try { bindPurgeHandlers(); } catch (e) { console.error('bindPurgeHandlers error (coldLoad)', e); }
					try { ensurePurgeButtonsForAdmin(); } catch (e) { console.error('ensurePurgeButtonsForAdmin error (coldLoad)', e); }
				});
			} catch (e) { console.error('ajaxify data/cold hook attach error', e); }
		} catch (e) { console.error('ajaxify hook attach error', e); }

		// Fast-path: if category items are already present in the DOM, ensure
		// purge buttons and handlers right away so the user sees them on first click.
		try {
			if (document.querySelectorAll && document.querySelectorAll('li[component="categories/category"]').length) {
				try { ensurePurgeButtonsForAdmin(); } catch (e) { console.error('ensurePurgeButtonsForAdmin fast-path error', e); }
				try { bindPurgeHandlers(); } catch (e) { console.error('bindPurgeHandlers fast-path error', e); }
			}
		} catch (e) { /* ignore */ }

		// Extra robust fallback: watch the DOM for category list insertions and
		// append purge buttons when category items appear. This covers cases
		// where other client scripts or templates inject content after our init.
		try {
			let observer;
			function startWatchingForCategories() {
				if (observer) return;
				observer = new MutationObserver(function (mutations) {
					let found = false;
					for (const m of mutations) {
						if (!m.addedNodes) continue;
						for (const n of m.addedNodes) {
							if (!(n instanceof Element)) continue;
							if (n.matches && n.matches('li[component="categories/category"]')) found = true;
							if (n.querySelector && n.querySelector('li[component="categories/category"]')) found = true;
						}
					}
					if (found) {
						// re-ensure buttons and handlers
						try { appendPurgeButtonsToDOM(); } catch (e) { /* ignore */ }
						try { bindPurgeHandlers(); } catch (e) { /* ignore */ }
					}
				});
				observer.observe(document.documentElement || document.body, { childList: true, subtree: true });
			}
			startWatchingForCategories();
		} catch (e) { /* silently ignore observer failures */ }
	};
	return categories;
});