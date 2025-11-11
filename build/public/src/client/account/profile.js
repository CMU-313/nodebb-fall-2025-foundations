'use strict';


define('forum/account/profile', [
	'forum/account/header',
	'bootbox',
	'api',
	'alerts',
], function (header, bootbox, api, alerts) {
	const Account = {};

	function normalizeUniversity(input) {
		if (!input) return '';
		const s = input.replace(/<[^>]*>/g, '').trim();
		const small = { of: true, the: true };
		const parts = s.split(/\s+/).map(function (w, i) {
			const lw = w.toLowerCase();
			if (i === 0) {
				return lw.charAt(0).toUpperCase() + lw.slice(1);
			}
			if (small[lw]) {
				return lw;
			}
			return lw.charAt(0).toUpperCase() + lw.slice(1);
		});
		return parts.join(' ');
	}

	function normalizeLocationPart(input, type) {
		if (!input) return '';
		const s = input.replace(/<[^>]*>/g, '').trim();
		const joined = s.split(/\s+/).map(function (w) {
			const lw = w.toLowerCase();
			return lw.charAt(0).toUpperCase() + lw.slice(1);
		}).join(' ');
		if (type === 'state' && joined.replace(/\s+/g, '').length === 2) {
			return joined.replace(/\s+/g, '').toUpperCase();
		}
		if (type === 'country' && joined.replace(/\s+/g, '').length === 3) {
			return joined.replace(/\s+/g, '').toUpperCase();
		}
		return joined;
	}

	Account.init = function () {
		header.init();

		app.enterRoom('user/' + ajaxify.data.theirid);

		processPage();

		if (parseInt(ajaxify.data.emailChanged, 10) === 1) {
			bootbox.alert({
				message: '[[user:emailUpdate.change-instructions]]',
				closeButton: false,
			});
		}

		socket.removeListener('event:user_status_change', onUserStatusChange);
		socket.on('event:user_status_change', onUserStatusChange);
	};

	function processPage() {
		$('[component="posts"] [component="post/content"] img:not(.not-responsive), [component="aboutme"] img:not(.not-responsive)').addClass('img-fluid');

		// Add clickable 'add university' if viewing own profile and field missing
		const isSelf = parseInt(ajaxify.data.uid, 10) === parseInt(ajaxify.data.theirid, 10);
		if (isSelf) {
			// find if university field exists in custom fields
			const hasUniversity = (ajaxify.data.customUserFields || []).some(f => f.key === 'university' && f.value);
			if (!hasUniversity) {
				// append a small card to aboutme area
				// use fallback insertion points so it shows even if profile has lots of content
				const el = $('<div class="card p-2 mb-3" id="add-university-card"><a href="#" id="profile-add-university">Add University</a></div>');
				const $about = $('[component="aboutme"]').first();
				if ($about.length) {
					$about.after(el);
				} else {
					const $stats = $('.account-stats').first();
					if ($stats.length) {
						$stats.before(el);
					} else {
						const $profileContainer = $('.account .container').first();
						if ($profileContainer.length) {
							$profileContainer.prepend(el);
						} else {
							// last-resort fallback to body so admin always sees the prompt
							$('body').prepend(el);
						}
					}
				}
				$('#profile-add-university').on('click', function (e) {
					e.preventDefault();
					bootbox.dialog({
						title: 'Add University',
						message: '<p><input class="form-control mb-2" id="boot-university" placeholder="University"></p><p><input class="form-control" id="boot-gradyear" placeholder="Graduation Year" type="number"></p>',
						buttons: {
							cancel: { label: 'Cancel', className: 'btn-light' },
							submit: {
								label: 'Save',
								className: 'btn-primary',
								callback: function () {
									var uni = $('#boot-university').val() || '';
									var yr = $('#boot-gradyear').val() || '';
									uni = normalizeUniversity(uni);
									yr = yr.toString().replace(/[^0-9]/g, '');
									var payload = { uid: ajaxify.data.theirid };
									if (uni && yr) {
										var yy = yr.slice(-2);
										payload.university = uni + ' (\'' + yy + ')';
									} else if (uni) {
										payload.university = uni;
									}
									if (!payload.university) {
										return false;
									}
									// send update via API
									api.put('/users/' + ajaxify.data.theirid, payload).then(function () {
										alerts.success('[[user:profile-update-success]]');
										// Update the profile UI in-place instead of reloading
										try {
											// remove the add-university card if present
											$('#add-university-card').remove();
											// build stat card matching template structure
											var displayName = 'University';
											var iconClass = 'fa-solid fa-graduation-cap';
											var $stat = $(
												'<div class="stat">' +
													'<div class="align-items-center justify-content-center card card-header p-3 border-0 rounded-1 h-100 gap-2">' +
														'<span class="stat-label text-xs fw-semibold"><span><i class="text-muted ' + iconClass + '"></i> ' + displayName + '</span></span>' +
														'<span class="text-center fs-6 ff-secondary"></span>' +
													'</div>' +
												'</div>'
											);
											$stat.find('.ff-secondary').text(payload.university);
											// append to the stats row
											var $row = $('.account-stats .row').first();
											if ($row.length) {
												$row.append($stat);
											} else {
												// fallback to reload if structure unexpected
												window.location.reload();
												return;
											}
											// update ajaxify data so UI logic won't re-show add link
											ajaxify.data.customUserFields = ajaxify.data.customUserFields || [];
											ajaxify.data.customUserFields.push({ key: 'university', name: displayName, value: payload.university, icon: iconClass, type: 'input-text' });
											// keep ajaxify.data.university in sync for the edit page prefill logic
											ajaxify.data.university = payload.university;
										} catch (e) {
											// if anything goes wrong, reload as a fallback
											window.location.reload();
										}
									}).catch(function (err) {
										alerts.error(err);
									});
								},
							},
						},
					});
				});
			}

			// Add clickable 'add location' if viewing own profile and field missing
			const hasLocation = (ajaxify.data.customUserFields || []).some(f => f.key === 'location' && f.value);
			if (!hasLocation) {
				const elLoc = $('<div class="card p-2 mb-3" id="add-location-card"><a href="#" id="profile-add-location">Add Location</a></div>');
				// Insert directly under university placeholder/stat if possible, else fallback to same insertion points
				const $universityStat = $('.account-stats .stat').filter(function () {
					return $(this).text().trim().includes('University');
				}).first();
				if ($universityStat.length) {
					$universityStat.after(elLoc);
				} else {
					// reuse same fallbacks as university
					const $about2 = $('[component="aboutme"]').first();
					if ($about2.length) {
						$about2.after(elLoc);
					} else if ($('.account-stats').first().length) {
						$('.account-stats').first().before(elLoc);
					} else if ($('.account .container').first().length) {
						$('.account .container').first().prepend(elLoc);
					} else {
						$('body').prepend(elLoc);
					}
				}

				$('#profile-add-location').on('click', function (e) {
					e.preventDefault();
					bootbox.dialog({
						title: 'Add Location',
						message: '<p><input class="form-control mb-2" id="boot-city" placeholder="City"></p><p><input class="form-control mb-2" id="boot-state" placeholder="State"></p><p><input class="form-control" id="boot-country" placeholder="Country"></p>',
						buttons: {
							cancel: { label: 'Cancel', className: 'btn-light' },
							submit: {
								label: 'Save',
								className: 'btn-primary',
								callback: function () {
									var city = normalizeLocationPart($('#boot-city').val() || '');
									var state = normalizeLocationPart($('#boot-state').val() || '', 'state');
									var country = normalizeLocationPart($('#boot-country').val() || '', 'country');
									var parts = [city, state, country].filter(Boolean).join(', ');
									if (!parts) {
										return false;
									}
									var payload = { uid: ajaxify.data.theirid, location: parts };
									api.put('/users/' + ajaxify.data.theirid, payload).then(function () {
										alerts.success('[[user:profile-update-success]]');
										try {
											$('#add-location-card').remove();
											// build stat card matching template structure
											var displayNameLoc = 'Location';
											var iconClassLoc = 'fa-solid fa-location-dot';
											var $statLoc = $(
												'<div class="stat">' +
													'<div class="align-items-center justify-content-center card card-header p-3 border-0 rounded-1 h-100 gap-2">' +
														'<span class="stat-label text-xs fw-semibold"><span><i class="text-muted ' + iconClassLoc + '"></i> ' + displayNameLoc + '</span></span>' +
														'<span class="text-center fs-6 ff-secondary"></span>' +
													'</div>' +
												'</div>'
											);
											$statLoc.find('.ff-secondary').text(parts);
											// insert under university stat when present
											if ($universityStat.length) {
												$universityStat.after($statLoc);
											} else {
												var $row2 = $('.account-stats .row').first();
												if ($row2.length) {
													$row2.append($statLoc);
												} else {
													window.location.reload();
													return;
												}
											}
											// update ajaxify data
											ajaxify.data.customUserFields = ajaxify.data.customUserFields || [];
											ajaxify.data.customUserFields.push({ key: 'location', name: displayNameLoc, value: parts, icon: iconClassLoc, type: 'input-text' });
											// keep ajaxify.data.location in sync for the edit page prefill logic
											ajaxify.data.location = parts;
										} catch (e) {
											window.location.reload();
										}
									}).catch(function (err) {
										alerts.error(err);
									});
								},
							},
						},
					});
				});
			}
		}
	}

	function onUserStatusChange(data) {
		if (parseInt(ajaxify.data.theirid, 10) !== parseInt(data.uid, 10)) {
			return;
		}

		app.updateUserStatus($('.account [data-uid="' + data.uid + '"] [component="user/status"]'), data.status);
	}

	return Account;
});
