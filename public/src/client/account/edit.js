'use strict';

define('forum/account/edit', [
	'forum/account/header',
	'accounts/picture',
	'translator',
	'api',
	'hooks',
	'bootbox',
	'alerts',
	'admin/modules/change-email',
], function (header, picture, translator, api, hooks, bootbox, alerts, changeEmail) {
	const AccountEdit = {};

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
				return lw; // keep 'of'/'the' lowercase when not first
			}
			return lw.charAt(0).toUpperCase() + lw.slice(1);
		});
		return parts.join(' ');
	}

	function normalizeLocationPart(input) {
		if (!input) return '';
		const s = input.replace(/<[^>]*>/g, '').trim();
		return s.split(/\s+/).map(function (w) {
			const lw = w.toLowerCase();
			return lw.charAt(0).toUpperCase() + lw.slice(1);
		}).join(' ');
		// If state is two letters, capitalize both
		if (type === 'state' && joined.replace(/\s+/g, '').length === 2) {
			return joined.replace(/\s+/g, '').toUpperCase();
		}
		// If country is three letters, capitalize all three
		if (type === 'country' && joined.replace(/\s+/g, '').length === 3) {
			return joined.replace(/\s+/g, '').toUpperCase();
		}
		return joined;
	}

	AccountEdit.init = function () {
		header.init();

		// If university field is pre-populated (from template / edit profile),
		// hide the "Add University" placeholder
		try {
			const existingUni = $('#university').length ? ($('#university').val() || '') : (ajaxify.data.university || '');
			if (existingUni && existingUni.toString().trim()) {
				$('#university-placeholder').hide();
				$('#university-fields').show();
			}
		} catch (e) {
			// supplied by chat --> defensive: if ajaxify or DOM not ready, ignore silently
		}

		// Defensive: If multiple university inputs are rendered for any reason,
		// keep the first and remove duplicates to avoid showing two fields.
		try {
			const uniEls = $('input#university');
			if (uniEls.length > 1) {
				uniEls.slice(1).each((i, el) => {
					$(el).closest('.mb-3').remove();
				});
			}

			const gradEls = $('input#graduationYear');
			if (gradEls.length > 1) {
				gradEls.slice(1).each((i, el) => {
					$(el).closest('.mb-3').remove();
				});
			}

			// Location duplicate cleanup
			const cityEls = $('input#location_city');
			if (cityEls.length > 1) {
				cityEls.slice(1).each((i, el) => {
					$(el).closest('.mb-3').remove();
				});
			}

			const stateEls = $('input#location_state');
			if (stateEls.length > 1) {
				stateEls.slice(1).each((i, el) => {
					$(el).closest('.mb-3').remove();
				});
			}

			const countryEls = $('input#location_country');
			if (countryEls.length > 1) {
				countryEls.slice(1).each((i, el) => {
					$(el).closest('.mb-3').remove();
				});
			}
		} catch (e) {
			// ignore
		}

		// University add-toggle
		$('#addUniversityBtn').on('click', function (e) {
			e.preventDefault();
			$('#university-placeholder').hide();
			$('#university-fields').show();
		});

		// Location add-toggle
		$('#addLocationBtn').on('click', function (e) {
			e.preventDefault();
			$('#location-placeholder').hide();
			$('#location-fields').show();
		});

		$('#submitBtn').on('click', updateProfile);

		// If location is pre-populated, hide its placeholder and show fields, and prefill parts
		try {
			const existingLocation = ($('#location_city').length ? ($('#location_city').val() || '') : '') || (ajaxify.data.location || '');
			if (existingLocation && existingLocation.toString().trim()) {
				$('#location-placeholder').hide();
				$('#location-fields').show();
				// If there's a combined location string in ajaxify, split it into parts
				if (ajaxify.data.location && !$('#location_city').val()) {
					const parts = ajaxify.data.location.split(',').map(p => p.trim());
					$('#location_city').val(parts[0] ? normalizeLocationPart(parts[0]) : '');
					$('#location_state').val(parts[1] ? normalizeLocationPart(parts[1], 'state') : '');
					$('#location_country').val(parts[2] ? normalizeLocationPart(parts[2], 'country') : '');
				}
			}
		} catch (e) {
			// ignore
		}

		if (ajaxify.data.groupTitleArray.length === 1 && ajaxify.data.groupTitleArray[0] === '') {
			$('#groupTitle option[value=""]').attr('selected', true);
		}

		handleAccountDelete();
		handleEmailConfirm();
		updateSignature();
		updateAboutMe();
		handleGroupControls();

		if (!ajaxify.data.isSelf && ajaxify.data.canEdit) {
			$(`a[href="${config.relative_path}/user/${ajaxify.data.userslug}/edit/email"]`).on('click', () => {
				changeEmail.init({
					uid: ajaxify.data.uid,
					email: ajaxify.data.email,
					onSuccess: function () {
						alerts.success('[[user:email-updated]]');
					},
				});
				return false;
			});
		}
	};

	function updateProfile() {
		function getGroupSelection() {
			const els = $('[component="group/badge/list"] [component="group/badge/item"][data-selected="true"]');
			return els.map((i, el) => $(el).attr('data-value')).get();
		}
		const editForm = $('form[component="profile/edit/form"]');
		const userData = editForm.serializeObject();

		// stringify multi selects
		editForm.find('select[multiple]').each((i, el) => {
			const name = $(el).attr('name');
			if (userData[name] && !Array.isArray(userData[name])) {
				userData[name] = [userData[name]];
			}
			userData[name] = JSON.stringify(userData[name] || []);
		});

		// sanitize and format university input if present
		if (userData.university) {
			userData.university = normalizeUniversity(userData.university);
		}

		if (userData.graduationYear) {
			userData.graduationYear = userData.graduationYear.toString().replace(/[^0-9]/g, '');
		}

		// if both present, combine into a single display string stored in university custom field
		if (userData.university && userData.graduationYear) {
			// takes the last two digits and shortens them
			const l2 = userData.graduationYear.toString().slice(-2);
			userData.university = userData.university + ' (\'' + l2 + ')';
		}

		// Normalize and combine location parts if present into single `location` field
		if (userData.location_city) {
			userData.location_city = normalizeLocationPart(userData.location_city);
		}
		if (userData.location_state) {
			userData.location_state = normalizeLocationPart(userData.location_state, 'state');
		}
		if (userData.location_country) {
			userData.location_country = normalizeLocationPart(userData.location_country, 'country');
		}

		if (userData.location_city || userData.location_state || userData.location_country) {
			const parts = [userData.location_city, userData.location_state, userData.location_country].filter(Boolean);
			if (parts.length) {
				userData.location = parts.join(', ');
			}
		} else {
			// allow delete / clear functionality by leaving fields blank
			userData.location = '';
		}

		userData.uid = ajaxify.data.uid;
		userData.groupTitle = userData.groupTitle || '';
		userData.groupTitle = JSON.stringify(getGroupSelection());

		hooks.fire('action:profile.update', userData);

		api.put('/users/' + userData.uid, userData).then((res) => {
			alerts.success('[[user:profile-update-success]]');

			// Update ajaxify.data so the profile view and quick-add logic stay in sync
			ajaxify.data.university = userData.university || ajaxify.data.university;
			ajaxify.data.location = userData.location || ajaxify.data.location;

			// If user set/updated location, update or create the stat card so profile shows the new value
			if (userData.location && userData.location !== '') {
				var $locStat = $('.account-stats .stat').filter(function () {
					return $(this).text().trim().includes('Location');
				}).first();
				if ($locStat.length) {
					$locStat.find('.ff-secondary').text(userData.location);
				} else {
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
					$statLoc.find('.ff-secondary').text(userData.location);
					// try to insert after university stat if present
					var $uni = $('.account-stats .stat').filter(function () {
						return $(this).text().trim().includes('University');
					}).first();
					if ($uni.length) {
						$uni.after($statLoc);
					} else {
						$('.account-stats .row').first().append($statLoc);
					}
				}
				// also ensure ajaxify.customUserFields contains the up-to-date value
				ajaxify.data.customUserFields = ajaxify.data.customUserFields || [];
				var found = false;
				for (var i = 0; i < ajaxify.data.customUserFields.length; i++) {
					if (ajaxify.data.customUserFields[i].key === 'location') {
						ajaxify.data.customUserFields[i].value = userData.location;
						found = true;
						break;
					}
				}
				if (!found) {
					ajaxify.data.customUserFields.push({ key: 'location', name: 'Location', value: userData.location, icon: 'fa-solid fa-location-dot', type: 'input-text' });
				}
			}

			if (res.picture) {
				$('#user-current-picture').attr('src', res.picture);
			}

			picture.updateHeader(res.picture);
		}).catch(alerts.error);

		return false;
	}



	function handleAccountDelete() {
		$('#deleteAccountBtn').on('click', function () {
			translator.translate('[[user:delete-account-confirm]]', function (translated) {
				const modal = bootbox.confirm(translated + '<p><input type="password" class="form-control" id="confirm-password" /></p>', function (confirm) {
					if (!confirm) {
						return;
					}

					const confirmBtn = modal.find('.btn-primary');
					confirmBtn.html('<i class="fa fa-spinner fa-spin"></i>');
					confirmBtn.prop('disabled', true);
					api.del(`/users/${ajaxify.data.uid}/account`, {
						password: $('#confirm-password').val(),
					}, function (err) {
						function restoreButton() {
							translator.translate('[[modules:bootbox.confirm]]', function (confirmText) {
								confirmBtn.text(confirmText);
								confirmBtn.prop('disabled', false);
							});
						}

						if (err) {
							restoreButton();
							return alerts.error(err);
						}

						confirmBtn.html('<i class="fa fa-check"></i>');
						window.location.href = `${config.relative_path}/`;
					});

					return false;
				});

				modal.on('shown.bs.modal', function () {
					modal.find('input').focus();
				});
			});
			return false;
		});
	}

	function handleEmailConfirm() {
		$('#confirm-email').on('click', function () {
			const btn = $(this).attr('disabled', true);
			socket.emit('user.emailConfirm', {}, function (err) {
				btn.removeAttr('disabled');
				if (err) {
					return alerts.error(err);
				}
				alerts.success('[[notifications:email-confirm-sent]]');
			});
		});
	}

	function getCharsLeft(el, max) {
		return el.length ? '(' + el.val().length + '/' + max + ')' : '';
	}

	function updateSignature() {
		const el = $('#signature');
		$('#signatureCharCountLeft').html(getCharsLeft(el, ajaxify.data.maximumSignatureLength));

		el.on('keyup change', function () {
			$('#signatureCharCountLeft').html(getCharsLeft(el, ajaxify.data.maximumSignatureLength));
		});
	}

	function updateAboutMe() {
		const el = $('#aboutme');
		$('#aboutMeCharCountLeft').html(getCharsLeft(el, ajaxify.data.maximumAboutMeLength));

		el.on('keyup change', function () {
			$('#aboutMeCharCountLeft').html(getCharsLeft(el, ajaxify.data.maximumAboutMeLength));
		});
	}

	function handleGroupControls() {
		const { allowMultipleBadges } = ajaxify.data;
		$('[component="group/toggle/hide"]').on('click', function () {
			const groupEl = $(this).parents('[component="group/badge/item"]');
			groupEl.attr('data-selected', 'false');
			$(this).addClass('hidden');
			groupEl.find('[component="group/toggle/show"]').removeClass('hidden');
		});

		$('[component="group/toggle/show"]').on('click', function () {
			if (!allowMultipleBadges) {
				$('[component="group/badge/list"] [component="group/toggle/show"]').removeClass('hidden');
				$('[component="group/badge/list"] [component="group/toggle/hide"]').addClass('hidden');
				$('[component="group/badge/list"] [component="group/badge/item"]').attr('data-selected', 'false');
			}
			const groupEl = $(this).parents('[component="group/badge/item"]');
			groupEl.attr('data-selected', 'true');
			$(this).addClass('hidden');
			groupEl.find('[component="group/toggle/hide"]').removeClass('hidden');
		});

		$('[component="group/order/up"]').on('click', function () {
			const el = $(this).parents('[component="group/badge/item"]');
			el.insertBefore(el.prev());
		});
		$('[component="group/order/down"]').on('click', function () {
			const el = $(this).parents('[component="group/badge/item"]');
			el.insertAfter(el.next());
		});
	}

	return AccountEdit;
});
