package com.samlanning.core.server.behaviours;

import org.bff.javampd.player.Player.Status;
import org.bff.javampd.song.MPDSong;
import org.slf4j.Logger;

import com.samlanning.core.server.mpd.MPDMonitor.Listener;
import com.samlanning.core.server.switchboard.ServerSwitchboard;
import com.samlanning.core.server.util.Logging;

public class Behaviours {

    private static final Logger log = Logging.logger(Behaviours.class);

    public static void initialise(final ServerSwitchboard switchboard) {
        log.info("Initialising Behaviours");

        switchboard.listenToMPD(new Listener() {

            @Override
            public void statusChanged(Status status, long songStartTime) {
                switch (status) {
                    case STATUS_PLAYING:
                        switchboard.lighting().setStatePlayingMusic(songStartTime);
                        break;
                    case STATUS_PAUSED:
                    case STATUS_STOPPED:
                        switchboard.lighting().setStateStatic();
                        break;
                }
            }

            @Override
            public void songChanged(MPDSong song, long songStartTime) {
                switchboard.lighting().setCurrentSong(song, songStartTime);
            }

        });
    }

}
