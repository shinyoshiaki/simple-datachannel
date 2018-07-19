import wrtc from "wrtc";
import Events from "events";

export default class WebRTC {
  constructor() {
    this.rtc = null;
    this.dataChannels = {};
    this.type = "";
    this.ev = new Events.EventEmitter();
    this.nodeId = "";
    this.isConnected = false;
    this.onicecandidate = false;
    this.isDisconnected = false;
  }

  createDatachannel(label) {
    try {
      const dc = this.rtc.createDataChannel(label, {
        reliable: true
      });
      this._dataChannelEvents(dc, this.ev);
      this.dataChannels[label] = dc;
      return dc;
    } catch (dce) {
      console.log("dc established error: " + dce.message);
    }
  }

  _dataChannelEvents(channel) {
    channel.onopen = () => {
      console.log("dc opened");
      this.ev.emit("connect");
    };
    channel.onmessage = event => {
      this.ev.emit("data", { label: channel.label, data: event.data });
    };
    channel.onerror = err => {
      console.log("Datachannel Error: " + err);
    };
    channel.onclose = () => {
      console.log("DataChannel is closed");
      this.isDisconnected = true;
    };
  }

  _prepareNewConnection(opt) {
    let peer;
    if (opt.disable_stun) {
      console.log("disable stun");
      peer = new wrtc.RTCPeerConnection({
        iceServers: []
      });
    } else {
      peer = new wrtc.RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.webrtc.ecl.ntt.com:3478" }]
      });
    }

    peer.onicecandidate = evt => {
      if (!evt.candidate) {
        if (!this.onicecandidate) {
          this.onicecandidate = true;
          this.ev.emit("signal", peer.localDescription);
        }
      }
    };

    peer.ondatachannel = evt => {
      const dataChannel = evt.channel;
      this.dataChannels[dataChannel.label] = dataChannel;
      this._dataChannelEvents(dataChannel);
    };
    return peer;
  }

  makeOffer(label, opt = {}) {
    this.type = "offer";
    this.rtc = this._prepareNewConnection(opt);
    this.rtc.onnegotiationneeded = async () => {
      try {
        let offer = await this.rtc.createOffer();
        await this.rtc.setLocalDescription(offer);
      } catch (err) {
        console.error("setLocalDescription(offer) ERROR: ", err);
      }
    };
    //＠重要：データチャネルはここでないとバグる
    this.createDatachannel(label);
  }

  setAnswer(sdp) {
    try {
      this.rtc.setRemoteDescription(sdp);
    } catch (err) {
      console.error("setRemoteDescription(answer) ERROR: ", err);
    }
  }

  async makeAnswer(sdp, opt = {}) {
    this.type = "answer";
    this.rtc = this._prepareNewConnection(opt);
    try {
      await this.rtc.setRemoteDescription(sdp);
      try {
        const answer = await this.rtc.createAnswer();
        await this.rtc.setLocalDescription(answer);
      } catch (err) {
        console.error(err);
      }
    } catch (err) {
      console.error("setRemoteDescription(offer) ERROR: ", err);
    }
  }

  send(data, label) {
    try {
      this.dataChannels[label].send(data);
    } catch (error) {
      this.isDisconnected = true;
    }
  }

  connected() {
    this.isConnected = true;
  }

  connecting(nodeId) {
    this.nodeId = nodeId;
  }
}
