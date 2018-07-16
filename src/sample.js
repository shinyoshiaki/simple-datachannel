import WebRTC from "./index";
const peerOffer = new WebRTC();
const peerAnswer = new WebRTC();

peerOffer.makeOffer("test");
peerOffer.ev.on("signal", sdp => {
  console.log("offer signal");
  peerAnswer.makeAnswer(sdp);
  peerAnswer.ev.on("signal", sdp => {
    peerOffer.setAnswer(sdp);
  });
});
peerOffer.ev.on("connect", () => console.log("connected"));
