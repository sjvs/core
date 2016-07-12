package com.samlanning.synesthesia.player;

import java.util.Iterator;

/**
 * An event player can play an {@link EventSheet} by calling an event handler
 * when the events occur.
 * 
 * @param <Event> - the type of events for this event player
 */
public class EventPlayer<Event> {

    private final EventSheet<Event> sheet;
    private PlayThread playThread;

    public EventPlayer(EventSheet<Event> sheet) {
        this.sheet = sheet;
    }

    private synchronized void startThread(long playerStartTime) {
        if (playThread == null || !playThread.isAlive()) {
            playThread = new PlayThread(playerStartTime);
            playThread.start();
        }
    }

    private synchronized void stopThread() {
        if (playThread != null) {
            playThread.stopOnInterrupt();
            playThread.interrupt();
        }
    }

    public void playAndWait(long playerStartTime) throws InterruptedException {
        this.startThread(playerStartTime);
        playThread.waitUntilFinished();
    }

    public void stop() {
        this.stopThread();
    }

    private class PlayThread extends Thread {

        private final long playerStartTime;

        private boolean stopOnInterrupt = false;
        private boolean finished = false;

        public PlayThread(long playerStartTime) {
            this.playerStartTime = playerStartTime;
        }

        @Override
        public void run() {
            Iterator<EventMarker<Event>> markers = sheet.readEventMarkers().iterator();
            EventMarker<Event> currentEventMarker = null;
            while (true) {
                try {
                    // Take the next marker from the list if we can
                    if (currentEventMarker == null) {
                        if (markers.hasNext())
                            currentEventMarker = markers.next();
                        else
                            break; // finished
                    }

                    // currentEventMarker will be set here
                    long currentTime = System.currentTimeMillis() - playerStartTime;
                    if (currentEventMarker.time <= currentTime) {
                        // Fire event!
                        this.playEvent(currentEventMarker.event);
                        currentEventMarker = null;
                        continue;
                    }

                    // We need to wait before firing event.
                    Thread.sleep(currentEventMarker.time - currentTime);
                } catch (InterruptedException e) {
                    if (stopOnInterrupt)
                        return;
                    // Loop back
                    continue;
                }
            }
            this.finished();
        }

        private void playEvent(Event event) {
            System.out.format("Event: %s\n", event);
        }

        private void finished() {
            this.finished = true;
            synchronized (this) {
                this.notifyAll();
            }
        }

        public void stopOnInterrupt() {
            this.stopOnInterrupt = true;
        }

        public void waitUntilFinished() throws InterruptedException {
            synchronized (this) {
                while (!finished)
                    this.wait();

            }
        }
    }

}
