angular
.module('app.widgets')
.controller('RussoundCtrl', russoundCtrl);

russoundCtrl.$inject = ['$scope', '$rootScope', '$element', 'OHService'];
function russoundCtrl($scope, $rootScope, $element, OHService) {
	var vm = this;

	var utils = {
		isUndefined: function (val) {
			if (val === undefined || val === null || val === "") {
				return true;
			}

			if (typeof val === 'string' || val instanceof String) {
				var lcVal = val.toLowerCase();
				return lcVal === 'null' || lcVal === 'n/a';
			}

			return false;
		},

		isDefined: function (val) {
			return !utils.isUndefined(val);
		},

		toLower: function (val) {
			if (typeof val === 'string' || val instanceof String) {
				return val.toLowerCase();
			}
			return val;
		}
	};

	vm.sysInfo = {
		sysId: 0,
		controllerId: 0,
		srcId: 0,
		zoneId: 0,

		//^russound_zone_(\d+)_(\d+)_(\d+)_name$/g
		patterns: {
			zoneName: new RegExp("^russound_zone_(\\S+)_(\\d+)_(\\d+)_name$", "i"),
			rio: new RegExp("^russound_rio_(\\S+)_(\\S+)$", "i"),
			ctrl: new RegExp("^russound_controller_(\\S+)_(\\d+)_(\\S+)$", "i"),
			src: new RegExp("^russound_source_(\\S+)_(\\d+)_(\\S+)$", "i"),
			zone: new RegExp("^russound_zone_(\\S+)_(\\d+)_(\\d+)_(\\S+)$", "i"),
			tuner: new RegExp("^.*(am|fm).*(am|fm)*.tuner.*$", "i")
		},

		getRioChannel: function (channelName) {
			return "russound_rio_" + vm.sysInfo.sysId + "_" + channelName;
		},

		getZoneChannel: function (channelName) {
			return "russound_zone_" + vm.sysInfo.sysId + "_" + vm.sysInfo.controllerId + "_" + vm.sysInfo.zoneId + "_" + channelName;
		},

		getSourceChannel: function (channelName) {
			return "russound_source_" + vm.sysInfo.sysId + "_" + vm.sysInfo.srcId + "_" + channelName;
		},

		getItemState: function (channel, defaultVal) {
			if (utils.isUndefined(channel))
				return defaultVal;
			var item = OHService.getItem(channel);
			if (utils.isUndefined(item))
				return defaultVal;

			var itemState = item.state;
			return utils.isUndefined(itemState) ? defaultVal : itemState;
		},

		getJsonProperty: function (json, property, defaultVal) {
			if (typeof json === 'string' || json instanceof String) {
				json = angular.fromJson(json);
			}

			if (utils.isDefined(json)) {
				var prop = json[property];
				return utils.isDefined(prop) ? prop : defaultVal;
			}
		},

		getSuggestedFavoriteName: function () {
			var channelname = vm.sysInfo.getItemState(vm.sysInfo.getSourceChannel("channelname"));
			if (utils.isDefined(channelname)) {
				return channelname;
			}

			var playlistname = vm.sysInfo.getItemState(vm.sysInfo.getSourceChannel("playlistname"));
			if (utils.isDefined(playlistname)) {
				return playlistname;
			}

			var channel = vm.sysInfo.getItemState(vm.sysInfo.getSourceChannel("channel"));
			if (utils.isDefined(channel)) {
				return channel;
			}

			return "My Favorite";
		},

		selectZone: function (zone) {
			if (vm.sysInfo.controllerId != zone.controllerId || vm.sysInfo.zoneId != zone.zoneId) {
				vm.sysInfo.controllerId = zone.controllerId;
				vm.sysInfo.zoneId = zone.zoneId;
				vm.sysInfo.serviceManager.resetZone();
			}
		},

		getZonePower: function (zone) {
			return vm.sysInfo.getItemState("russound_zone_" + vm.sysInfo.sysId + "_" + zone.controllerId + "_" + zone.zoneId + "_status");
		},
		toggleZonePower: function (zone) {
			var channel = "russound_zone_" + vm.sysInfo.sysId + "_" + zone.controllerId + "_" + zone.zoneId + "_status";
			return OHService.sendCmd(channel, vm.sysInfo.getItemState(channel) === "ON" ? "OFF" : "ON");
		}
	};

	vm.banks = {
		bankId: 1,

		presetIds: [],

		leftBank: function () {
			vm.banks.bankId = ((vm.banks.bankId + 4) % 6) + 1;
		},

		rightBank: function () {
			vm.banks.bankId = (vm.banks.bankId % 6) + 1;
		},

		editor: {
			bankId: 1,
			bankName: '',
			presetIds: [],
			validName: true,
			leftBank: function () {
				vm.banks.editor.bankId = ((vm.banks.editor.bankId + 4) % 6) + 1;
			},

			rightBank: function () {
				vm.banks.editor.bankId = (vm.banks.editor.bankId % 6) + 1;
			},

			save: function () {
				var bank = vm.lists.banks[vm.banks.editor.bankId - 1];
				bank.name = vm.banks.editor.bankName;
				OHService.sendCmd(vm.sysInfo.getSourceChannel("banks"), angular.toJson([bank]));
			}
		},

		handleOverwrite: function (presetId) {
			vm.banks.tmpPreset.presetId = presetId;
			vm.banks.tmpPreset.presetName = vm.lists.presets[presetId - 1].name;
			vm.page.setPage('overwritePreset');
		},

		handleDelete: function (presetId) {
			vm.banks.tmpPreset.presetId = presetId;
			vm.banks.tmpPreset.presetName = vm.lists.presets[presetId - 1].name;
			vm.page.setPage('deletePreset');
		},

		handleAssign: function (presetId) {
			vm.banks.tmpPreset.presetId = presetId;
			vm.banks.tmpPreset.presetName = '';

			if (vm.lists.presets[presetId - 1].valid === false) {
				vm.page.setPage('assignPreset');
			} else {
				OHService.sendCmd(vm.sysInfo.getZoneChannel("event"), "restorePreset " + presetId);
			}
		},

		tmpPreset: {
			presetId: 1,
			presetName: '',
			bankName: function () {
				return vm.lists.banks[Math.floor((vm.banks.tmpPreset.presetId - 1) / 6)].name;
			},
			remove: function () {
				var preset = vm.lists.presets[vm.banks.tmpPreset.presetId - 1];
				preset.valid = false;
				preset.name = '';
				OHService.sendCmd(vm.sysInfo.getZoneChannel("presets"), angular.toJson([preset]));
			},
			save: function () {
				var preset = vm.lists.presets[vm.banks.tmpPreset.presetId - 1];
				preset.name = vm.banks.tmpPreset.presetName;
				preset.valid = true;
				OHService.sendCmd(vm.sysInfo.getZoneChannel("presets"), angular.toJson([preset]));
			}
		}
	};

	vm.nowplaying = {
		isRepeat: false,
		repeatModeIcon: '',

		isShuffle: false,

		coverArtUrl: '',

		isPaused: function (channelName) {
			var item = utils.toLower(vm.sysInfo.getItemState(channelName, "paused"));
			return item === "paused" || item === "stopped";
		},

		togglePlaying: function (channelName) {
			if (vm.nowplaying.isPaused()) {
				OHService.sendCmd(vm.sysInfo.getZoneChannel("keyrelease"), "Play");
			} else {
				OHService.sendCmd(vm.sysInfo.getZoneChannel("keyrelease"), "Pause");
			}
		},

		toggleRepeatMode: function (allowSingle) {
			var item = utils.toLower(vm.sysInfo.getItemState(vm.sysInfo.getSourceChannel("repeatmode"), "off"));
			if (item === "off") {
				OHService.sendCmd(vm.sysInfo.getSourceChannel("repeatmode"), "ALL");
			} else if (item === "all") {
				if (allowSingle === true) {
					OHService.sendCmd(vm.sysInfo.getSourceChannel("repeatmode"), "SINGLE");
				} else {
					OHService.sendCmd(vm.sysInfo.getSourceChannel("repeatmode"), "OFF");
				}
			} else {
				OHService.sendCmd(vm.sysInfo.getSourceChannel("repeatmode"), "OFF");
			}
		},

		toggleShuffleMode: function () {
			var item = utils.toLower(vm.sysInfo.getItemState(vm.sysInfo.getSourceChannel("shufflemode"), "off"));
			OHService.sendCmd(vm.sysInfo.getSourceChannel("shufflemode"), item === "off" ? "ON" : "OFF");
		}
	};

	vm.mm = {
		title: '',
		menuitems: [],

		isWaiting: false,

		infoText: '',
		backText: '',
		okText: '',

		form: {
			help: '',
			text: '',
			isSubmitting: false,
			okDisabled: false,
			submit: function () {
				vm.mm.form.isSubmitting = true;
				OHService.sendCmd(vm.sysInfo.getZoneChannel("event"), 'MMTextField "' + vm.mm.form.text + '"')
			}
		},

		menuIcon: function (attr) {
			if (attr.indexOf("!") >= 0) {
				return "pandora.jpg";
			} else if (attr.indexOf("@") >= 0) {
				return "tunein.png";
			} else if (attr.indexOf("#") >= 0) {
				return "siriusxm.jpg";
			} else if (attr.indexOf("$") >= 0) {
				return "internetradio.png";
			} else if (attr.indexOf("%") >= 0) {
				return "dlna.png";
			} else if (attr.indexOf("^") >= 0) {
				return "usb.png";
			} else if (attr.indexOf("&") >= 0) {
				return "spotify.png";
			} else {
				return "unknown.png";
			}
		},

		isPlaying: function (attr) {
			return attr.indexOf("P") >= 0;
		},

		isActive: function (attr) {
			return attr.indexOf("A") >= 0;
		},

		hasBackButton: function () {
			return utils.isDefined(vm.mm.backText);
		},

		hasFirst: function () {
			for (var i = vm.mm.menuitems.length - 1; i >= 0; i--) {
				if (vm.mm.menuitems[i].isFirst === true)
					return true;
			}
			return false;
		},

		hasLast: function () {
			for (var i = vm.mm.menuitems.length - 1; i >= 0; i--) {
				if (vm.mm.menuitems[i].isLast === true)
					return true;
			}
			return false;
		},

		pageDown: function () {
			vm.mm.isWaiting = true;
			OHService.sendCmd(vm.sysInfo.getZoneChannel("keyrelease"), "PageDown");
		},

		pageUp: function () {
			vm.mm.isWaiting = true;
			OHService.sendCmd(vm.sysInfo.getZoneChannel("keyrelease"), "PageUp");
		},

		init: function () {
			vm.mm.isWaiting = true;
			OHService.sendCmd(vm.sysInfo.getZoneChannel("mminit"), "ON");
		},

		initContextMenu: function () {
			vm.mm.isWaiting = true;
			OHService.sendCmd(vm.sysInfo.getZoneChannel("mmcontextmenu"), "ON");
		},

		home: function () {
			vm.mm.isWaiting = true;
			OHService.sendCmd(vm.sysInfo.getZoneChannel("mminit"), "ON");
		},

		close: function () {
			OHService.sendCmd(vm.sysInfo.getZoneChannel("event"), "MMClose");
		},

		back: function () {
			vm.mm.isWaiting = true;
			OHService.sendCmd(vm.sysInfo.getZoneChannel("event"), "MMPrevScreen");
		},

		ok: function () {
			vm.mm.isWaiting = true;
			OHService.sendCmd(vm.sysInfo.getZoneChannel("event"), "MMSelectOk");
		},

		selectItem: function (idx) {
			vm.mm.isWaiting = true;
			OHService.sendCmd(vm.sysInfo.getZoneChannel("event"), "MMSelectItem " + idx);
		}
	}

	vm.page = {
		id: 'nowplaying',
		subid: 'none',

		prior: {
			id: 'nowplaying',
			subid: 'none'
		},

		priorPage: function () {
			vm.page.setPage(utils.isDefined(vm.page.prior.id) ? vm.page.prior.id : 'nowplaying',
				utils.isDefined(vm.page.prior.subid) ? vm.page.prior.subid : 'none');
		},

		isPage: function (name) {
			return vm.page.id === name;
		},

		isSubPage: function (name) {
			return vm.page.subid === name;
		},

		setPage: function (pageId, subId) {
			vm.page.prior.id = vm.page.id;
			vm.page.prior.subid = vm.page.subid;

			if (utils.isDefined(pageId)) {
				vm.page.id = pageId;
			}
			if (utils.isDefined(subId)) {
				vm.page.subid = subId;
			}
		},

		resetSubId: function (type, mode) {
			var pwr = vm.sysInfo.getItemState(vm.sysInfo.getZoneChannel("status"));
			if (utils.toLower(pwr) !== "on") {
				return "nopower";
			}
			
			if (utils.isUndefined(type)) {
				type = vm.sysInfo.getItemState(vm.sysInfo.getSourceChannel("type"));
			}

			if (utils.isUndefined(mode)) {
				mode = vm.sysInfo.getItemState(vm.sysInfo.getSourceChannel("mode"));
			}

			if (utils.isDefined(type)) {
				if (vm.sysInfo.patterns.tuner.test(type)) {
					vm.page.subid = 'tuner';
					return;
				}
			}
			if (utils.isDefined(mode)) {
				vm.page.subid = utils.toLower(mode);
			} else {
				vm.page.subid = 'unknown'
			}
		}
	};

	vm.lists = {
		zones: [],
		sources: [],
		favorites: [],
		banks: [],
		presets: []
	};

	vm.favorites = {
		addFavorite: function (id, name) {
			var arry = [];
			for (var x = vm.lists.favorites.length - 1; x >= 0; x--) {
				if (x == id - 1) {
					arry.push({
						id: id,
						valid: true,
						name: name
					});
				} else if (vm.lists.favorites[x].valid === true) {
					arry.push(vm.lists.favorites[x])
				}
			}
			OHService.sendCmd(vm.sysInfo.getZoneChannel("systemfavorites"), angular.toJson(arry));
		},

		overwriteFavorite: function (id, name) {
			var arry = [];
			for (var x = vm.lists.favorites.length - 1; x >= 0; x--) {
				if (x == id - 1) {
					arry.push({
						id: id,
						valid: true,
						name: name
					});
				} else if (vm.lists.favorites[x].valid === true) {
					arry.push(vm.lists.favorites[x])
				}
			}
			OHService.sendCmd(vm.sysInfo.getZoneChannel("systemfavorites"), angular.toJson(arry));
		},

		deleteFavorite: function (id) {
			var arry = [];
			for (var x = vm.lists.favorites.length - 1; x >= 0; x--) {
				if (x == id - 1) {
					arry.push({
						id: id,
						valid: false
					});
				} else if (vm.lists.favorites[x].valid === true) {
					arry.push(vm.lists.favorites[x])
				}
			}
			OHService.sendCmd(vm.sysInfo.getZoneChannel("systemfavorites"), angular.toJson(arry));
		},

		restoreFavorite: function (id) {
			OHService.sendCmd(vm.sysInfo.getZoneChannel("event"), "restoreSystemFavorite " + id);
		},

		nextValidSlot: 1,

		tmpInfo: {
			id: 1,
			name: '',
			openSlot: false,
			validName: false,

			setFrom: function (id, name) {
				vm.favorites.tmpInfo.id = id;
				if (name === undefined) {
					vm.favorites.tmpInfo.name = vm.lists.favorites[id - 1].name;
				} else {
					vm.favorites.tmpInfo.name = name;
				}
			}
		}
	}

	// Setup flex
	var $elm = $element.parent();
	for (var i = 0; i < 10; i++) {
		$elm = $elm.parent();
		if (utils.isUndefined($elm)) break;
		
		if ($elm.hasClass("template-contents")) {
			$elm.css("margin-top", "initial");
			$elm.css("margin-bottom", "initial");
			break;
		}
	};

	// initialize favorites to all invalid
	for (var x = 0; x < 36; x++) {
		vm.lists.favorites[x] = {
			id: x + 1,
			valid: false
		};
		vm.lists.presets[x] = {
			id: x + 1,
			valid: false
		};
	}

	// initialize banks
	for (var x = 0; x < 6; x++) {
		vm.lists.banks[x] = {
			id: x + 1,
			name: "Bank " + (x + 1)
		};
	}

	$scope.$watch(function () {
		return vm.banks.bankId
	}, function (nv, ov) {
		var presets = [];
		for (var i = 1; i <= 6; i++) {
			presets.push((nv - 1) * 6 + i);
		}
		vm.banks.presetIds = presets;
	});

	$scope.$watch(function () {
		return vm.banks.editor.bankId
	}, function (nv, ov) {
		var presetIds = [];
		for (var i = 1; i <= 6; i++) {
			presetIds.push((nv - 1) * 6 + i);
		}
		vm.banks.editor.presetIds = presetIds;
		vm.banks.editor.bankName = vm.lists.banks[nv - 1].name;
	});

	$scope.$watch(function () {
		return vm.banks.editor.bankName
	}, function (nv, ov) {
		vm.banks.editor.validName = utils.isDefined(nv);
	});

	$scope.$watch(function () {
		return vm.favorites.tmpInfo.name;
	}, function (nv, ov) {
		vm.favorites.tmpInfo.validName = utils.isDefined(nv);
	});

	$scope.$watch(function () {
		return vm.mm.form.text
	}, function (nv, ov) {
		vm.mm.form.okDisabled = utils.isUndefined(nv);
	});

	$scope.$watch(function () {
		return $scope.config === undefined ? undefined : $scope.config.zone_name;
	}, function (nv, ov) {
		if (nv === undefined) {
			vm.page.setPage("configInvalid");
		} else {
			var match = vm.sysInfo.patterns.zoneName.exec(nv);
			if (match == null || match.length != 4) {
				vm.page.setPage("configInvalid");
				console.log("Zone name channel is not formatted correctly - must follow: 'russound:zone:[sysId]:[ctrlId]:[zoneId]:name rather than " + nv);
			} else {
				vm.page.setPage("none");
				vm.sysInfo.sysId = match[1];
				vm.sysInfo.controllerId = match[2];
				vm.sysInfo.zoneId = match[3];
				vm.sysInfo.serviceManager.restart();
			}
		}
	});

	var sysService = {
		sources: function (id, state) {
			if (utils.isUndefined(state.nv)) {
				vm.lists.sources = [];
			} else {
				vm.lists.sources = angular.fromJson(state.nv);
			}
		}
	}

	var ctlService = {
		zones: function (id, state) {
			var oldZones = vm.lists.zones;
			// remove the old zones related to this controller
			for (var z = oldZones.length - 1; z >= 0; z--) {
				if (oldZones[z].controllerId == id.controllerId) {
					oldZones.splice(z, 1);
				}
			}

			if (utils.isDefined(state.nv)) {

				var zoneArry = angular.fromJson(state.nv);
				// add the new ones back
				for (var z = zoneArry.length - 1; z >= 0; z--) {
					oldZones.push({
						controllerId: id.controllerId,
						zoneId: zoneArry[z].id,
						name: zoneArry[z].name
					});
				}
			}

			vm.lists.zones = oldZones;
		}
	}

	var srcService = {
		banks: function (id, state) {
			var bankArray = [];
			if (utils.isDefined(state.nv)) {
				bankArray = angular.fromJson(state.nv);
			}
			for (var y = bankArray.length - 1; y >= 0; y--) {
				vm.lists.banks[bankArray[y].id - 1] = bankArray[y];
			}
		},

		coverarturl: function (id, state) {

			if (utils.isDefined(state.nv)) {
				vm.nowplaying.coverArtUrl = state.nv;
			} else {
				vm.nowplaying.coverArtUrl = '/static/Russound/images/music.png'
			}			
		},

		mmhelptext: function (id, state) {
			vm.mm.form.help = utils.isDefined(state.nv) ? vm.sysInfo.getJsonProperty(state.nv, "value", "Loading...") : "Loading...";
		},
		mminfotext: function (id, state) {
			vm.mm.infoText = utils.isDefined(state.nv) ? vm.sysInfo.getJsonProperty(state.nv, "value", "Loading...") : "Loading...";
			vm.mm.isWaiting = false;
		},

		mmmenu: function (id, state) {
			var menuStr = vm.sysInfo.getJsonProperty(state.nv, "value");
			if (utils.isDefined(menuStr)) {
				var menuItems = vm.sysInfo.getJsonProperty(menuStr, "menuItems", []);
				vm.mm.menuitems = menuItems;
			} else {
				vm.mm.menuitems = [];
			}

			vm.mm.isWaiting = false;

		},

		mmmenubuttonbacktext: function (id, state) {
			vm.mm.okText = utils.isDefined(state.nv) ? vm.sysInfo.getJsonProperty(state.nv, "value", "OK") : "OK";
		},

		mmmenubuttonoktext: function (id, state) {
			vm.mm.okText = utils.isDefined(state.nv) ? vm.sysInfo.getJsonProperty(state.nv, "value", "OK") : "OK";
		},

		mmtextfield: function (id, state) {
			vm.mm.form.text = utils.isDefined(state.nv) ? vm.sysInfo.getJsonProperty(state.nv, "value", "") : "";
			vm.mm.isWaiting = false;

		},

		mmscreen: function (id, state) {
			if (utils.isDefined(state.nv)) {
				var mmscreen = utils.toLower(vm.sysInfo.getJsonProperty(state.nv, "value", "nowplaying"));

				vm.mm.form.isSubmitting = false;

				if (mmscreen === "sourcemenuscreen") {
					vm.page.setPage("mmmenu");
					vm.mm.isWaiting = true;
				} else if (mmscreen === "sourceinfoscreen") {
					vm.page.setPage("mminfo");
					vm.mm.isWaiting = true;
				} else if (mmscreen === "sourcetextentryscreen") {
					vm.page.setPage("mmentry");
					vm.mm.isWaiting = true;
				} else {
					vm.page.setPage("nowplaying");
					vm.page.resetSubId();
					vm.mm.isWaiting = false;

				}
			}

		},

		mmtitle: function (id, state) {
			vm.mm.title = utils.isDefined(state.nv) ? vm.sysInfo.getJsonProperty(state.nv, "value", "Loading...") : "Loading...";
		},

		mode: function (id, state) {
			vm.page.resetSubId(undefined, state.nv);
		},

		repeatmode: function (id, state) {
			var lowerNv = utils.toLower(state.nv);
			if (lowerNv === 'off' || lowerNv === undefined) {
				vm.nowplaying.isRepeat = false;
				vm.nowplaying.repeatModeIcon = '/static/Russound/images/repeat.png';
			} else if (lowerNv == 'single') {
				vm.nowplaying.isRepeat = true;
				vm.nowplaying.repeatModeIcon = '/static/Russound/images/repeatonce.png';
			} else {
				vm.nowplaying.isRepeat = true;
				vm.nowplaying.repeatModeIcon = '/static/Russound/images/repeatall.png';
			}

		},

		shufflemode: function (id, state) {
			vm.nowplaying.isShuffle = utils.toLower(state.nv) === "on";
		},

		type: function (id, state) {
			vm.page.resetSubId(state.nv, undefined);
		}
	}

	var zoneService = {
		presets: function (id, state) {
			var presetArray = [];
			if (utils.isDefined(state.nv)) {
				presetArray = angular.fromJson(state.nv);
			}
			for (var x = vm.lists.presets.length - 1; x >= 0; x--) {
				vm.lists.presets[x].valid = false;
			}
			for (var y = presetArray.length - 1; y >= 0; y--) {
				vm.lists.presets[presetArray[y].id - 1] = presetArray[y];
			}

		},

		source: function (id, state) {
			if (utils.isDefined(state.nv)) {
				vm.sysInfo.srcId = state.nv;
				vm.page.resetSubId();
				vm.sysInfo.serviceManager.resetSrc();
			}
		},

		status: function (id, state) {
			if (utils.isDefined(state.nv)) {
				if (utils.toLower(state.nv) === "on") {
					vm.page.setPage('nowplaying');
					vm.page.resetSubId();
				} else {
					vm.page.setPage('nowplaying', 'nopower');
				}
			}
		},

		systemfavorites: function (id, state) {
			var favArray = [];
			if (utils.isDefined(state.nv)) {
				favArray = angular.fromJson(state.nv);
			}
			for (var x = vm.lists.favorites.length - 1; x >= 0; x--) {
				vm.lists.favorites[x].valid = false;
			}
			for (var y = favArray.length - 1; y >= 0; y--) {
				vm.lists.favorites[favArray[y].id - 1] = favArray[y];
			}

			var slotNbr = -1;
			for (var x = 0; x < vm.lists.favorites.length; x++) {
				if (vm.lists.favorites[x].valid === false) {
					slotNbr = x + 1;
					break;
				}
			}
			vm.favorites.nextValidSlot = slotNbr;
		}
	}

	// In general - don't use "===" since sometimes our IDs are strings and sometimes numbers (depending on where they come from)
	var serviceManager = function () {
		var me = this;

		var cache = function () {
			var cacheMe = this;
			var last = {};

			cacheMe.clear = function () {
				last = {};
			};

			cacheMe.hasChanged = function (name, item) {

				var normalized = utils.isDefined(item) ? item : undefined;

				if (last.hasOwnProperty(name)) {
					if (angular.equals(last[name], normalized)) {
						return undefined;
					} else {
						var state = {
							nv: normalized,
							ov: last[name]
						};
						last[name] = normalized;
						return state;
					}
				} else {
					last[name] = normalized;
					return {
						 nv: normalized,
						 ov: normalized
					};
				}
			};
		};

		var sysCache = new cache();
		var ctrlCache = new cache();
		var srcCache = new cache();
		var zoneCache = new cache();

		var itemChanged = function (service, cache, id, channelName, itemState) {
			if (service !== undefined && channelName !== undefined) {
				channelName = channelName.toLowerCase();
				if (service.hasOwnProperty(channelName)) {
					var cacheState = cache.hasChanged(channelName, itemState);

					if (cacheState !== undefined) {
						service[channelName](id, cacheState);
					}
				}
			}

		}

		me.resetSrc = function () {
			srcCache.clear();

			var items = OHService.getItems();
			var max = items.length;
			// must be in ascending
			for (var i = 0; i < max; i++) {
				var matcher = null;
				if ((matcher = vm.sysInfo.patterns.src.exec(items[i].name)) != null) {
					if (matcher.length >= 3) {
						var sysId = matcher[1];
						var srcId = matcher[2];
						var channelName = matcher[3];
						if (sysId == vm.sysInfo.sysId && srcId == vm.sysInfo.srcId) {
							itemChanged(srcService, srcCache, {
								sysId: sysId,
								srcId: srcId,
							}, channelName, items[i].state);
						}
					}
				}
			}
			vm.page.resetSubId();
		};

		me.resetZone = function () {
			zoneCache.clear();

			var items = OHService.getItems();
			var max = items.length;

			// must be in ascending
			for (var i = 0; i < max; i++) {
				var matcher = null;
				if ((matcher = vm.sysInfo.patterns.zone.exec(items[i].name)) != null) {
					if (matcher.length >= 4) {
						var sysId = matcher[1];
						var controllerId = matcher[2];
						var zoneId = matcher[3];
						var channelName = matcher[4];
						if (sysId == vm.sysInfo.sysId && controllerId == vm.sysInfo.controllerId && zoneId == vm.sysInfo.zoneId) {
							itemChanged(zoneService, zoneCache, {
								sysId: sysId,
								controllerId: controllerId,
								zoneId: zoneId
							}, channelName, items[i].state);

						}
					}
				}
			}
			vm.page.resetSubId();
		};

		me.restart = function () {

			sysCache.clear();
			ctrlCache.clear();
			srcCache.clear();
			zoneCache.clear();

			var items = OHService.getItems();
			var max = items.length;
			for (var i = 0; i < max; i++) { // must be in ascending
				me.channelUpdate(null, items[i]);
			}
			vm.page.resetSubId();
		};

		me.channelUpdate = function (event, item) {
			// emitted on startup
			if (utils.isUndefined(item))
				return;

			try {
				var matcher = undefined;
				if ((matcher = vm.sysInfo.patterns.rio.exec(item.name)) !== null) {
					if (matcher.length >= 2) {
						var sysId = matcher[1];
						var channelName = matcher[2];
						if (sysId == vm.sysInfo.sysId) {
							itemChanged(sysService, sysCache, {
								sysId: sysId
							}, channelName, item.state);
						}
					}
				} else if ((matcher = vm.sysInfo.patterns.ctrl.exec(item.name)) !== null) {
					if (matcher.length >= 3) {
						var sysId = matcher[1];
						var controllerId = matcher[2];
						var channelName = matcher[3];

						// special exception for zones - we want to know all of them to select them
						if (sysId == vm.sysInfo.sysId && controllerId == vm.sysInfo.controllerId || utils.toLower(channelName) === "zones") {
							itemChanged(ctlService, ctrlCache, {
								sysId: sysId,
								controllerId: controllerId
							}, channelName, item.state);
						}
					}

				} else if ((matcher = vm.sysInfo.patterns.src.exec(item.name)) !== null) {
					if (matcher.length >= 3) {
						var sysId = matcher[1];
						var srcId = matcher[2];
						var channelName = matcher[3];
						if (sysId == vm.sysInfo.sysId && srcId == vm.sysInfo.srcId) {
							itemChanged(srcService, srcCache, {
								sysId: sysId,
								srcId: srcId
							}, channelName, item.state);

						}
					}

				} else if ((matcher = vm.sysInfo.patterns.zone.exec(item.name)) !== null) {
					if (matcher.length >= 4) {
						var sysId = matcher[1];
						var controllerId = matcher[2];
						var zoneId = matcher[3];
						var channelName = matcher[4];
						if (sysId == vm.sysInfo.sysId && controllerId == vm.sysInfo.controllerId && zoneId == vm.sysInfo.zoneId) {
							itemChanged(zoneService, zoneCache, {
								sysId: sysId,
								controllerId: controllerId,
								zoneId: zoneId
							}, channelName, item.state);

						}
					}
				}
			} catch (err) {
				console.log("Error processing " + item.name + ": " + err);
			}
		}
	}

	vm.sysInfo.serviceManager = new serviceManager();
	var handler = $rootScope.$on('openhab-update', vm.sysInfo.serviceManager.channelUpdate);
	$scope.$on('$destroy', handler);
}
