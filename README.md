# Russound RIO HabPanel Widget
This is more of an application than a widget but here is the official Russound widget (strictly to be used with the Russound Binding) to control any Russound MCA or X system (any RIO based system atleast).

# Channels
This widget deals with too many channels to individually setup each one of them in the settings. Instead, you will specify the zone name channel and the other channels are inferred from that channel. Specifically, the channels names must use the following formats:

* System Channels: russound_rio_(sysId)_(name)
* Source Channels: russound_source_(sysId)_(sourceId)_(name)
* Controller Channels: russound_controller_(sysId)_(controllerId)_(name)
* Zone Channels: russound_zone_(sysId)_(controllerId)_(zoneId)_(name)

Example: the 'bass' channel on zone 6, controller 2, system id 192168124 would be: russound_zone_192168124_2_6_bass

If you autodiscovered the device and have 'Simple Mode' linking set to on - the channels will be named properly to begin with

The following table lists what channels should be linked to fully support the widget:
* System: lang, allon, sources
* Controller: zones
* Source (tuner): name, type, channel, channelname, artistname, albumname, songname, mode, programservicename, radiotext, radiotext2, radiotext3, radiotext4, banks
* Source (non-tuner): name, type, channel, channelname, artistname, albumname, coverarturl, playlistname, songname, rating, mode, shufflemode, repeatmode, mmscreen, mmtitle, mmmenu, mmattr, mmmenubuttonoktext,mmmenubuttonbacktest, mminfotext,mmhelptext, mmtextfield
* Zone: name, source, bass, treble, balance, loudness, turnonvolume, donotdisturb, partymode, status, volume, mute, repeat, shuffle, rating, keyrelease, keycode, event, systemfavorites, zonefavorites, presets, mminit, mmcontextmenu

# Supported Browsers
* IE: 11+ (not tested)
* Edge: 16+
* Firefox: 56+
* Chrome: 61+
* IOS Safari: 10.3+

See [caniuse.com](https://caniuse.com/#feat=css-grid) for additional information.

# Installation
1. Download the ZIP file and copy the 'Russound' directory within to the '{openhab}/conf/html' directory. This should create a directory called '{openhab}/conf/html/Russound' containing a number of files (and an images subdirectory). 
2. Import the 'Russound.widget.json' file (found in the Russound directory) into HABPanel to create the widget (do NOT remove any of the other files in the Russound directory - as they are needed at runtime).