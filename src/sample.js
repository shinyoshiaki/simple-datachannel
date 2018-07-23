import WebRTC from "./WebRTC";
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
peerOffer.ev.once("connect", () => {
  console.log("offer connected");
  peerOffer.ev.on("data", data => console.log("ondata offer", data));
  peerOffer.send("hello", "test");
  peerOffer.send("test", "second");
});
peerAnswer.ev.once("connect", () => {
  console.log("answer connected");
  peerAnswer.ev.on("data", data => console.log("ondata answer", data));
  peerAnswer.send("hi", "test");
  peerAnswer.send("test!!", "third");
});
