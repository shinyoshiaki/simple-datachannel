import WebRTC from "./index";
const peerOffer = new WebRTC();
const peerAnswer = new WebRTC();

peerOffer.makeOffer("test", { disable_stun: true });
peerOffer.ev.on("signal", sdp => {
  console.log("offer signal");
  peerAnswer.makeAnswer(sdp, { disable_stun: true });
  peerAnswer.ev.on("signal", sdp => {
    peerOffer.setAnswer(sdp);
  });
});
peerOffer.ev.on("connect", () => console.log("offer connected"));
peerAnswer.ev.on("connect", () => console.log("answer connected"));
