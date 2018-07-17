import wrtc from "wrtc";
import Events from "events";

export default class WebRTC {
  constructor() {
    this.rtc = null;
    this.dataChannels = {};
    this.dataChannel = null;
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

  _prepareNewConnection() {
    const pc_config = {
      iceServers: [{ urls: "stun:stun.webrtc.ecl.ntt.com:3478" }]
    };
    const peer = new wrtc.RTCPeerConnection(pc_config);

    peer.onicecandidate = evt => {
      if (!evt.candidate) {
        console.log("empty ice event");
        if (!this.onicecandidate) {
          this.onicecandidate = true;
          this.ev.emit("signal", peer.localDescription);
        }
      }
    };

    peer.ondatachannel = evt => {
      if (this.dataChannel === null) {
        this.dataChannel = evt.channel;
        this._dataChannelEvents(evt.channel);
      }
    };
    return peer;
  }

  makeOffer(label) {
    this.type = "offer";
    this.rtc = this._prepareNewConnection();
    console.log("makeOffer", label);
    this.rtc.onnegotiationneeded = async () => {
      try {
        let offer = await this.rtc.createOffer();
        await this.rtc.setLocalDescription(offer);
      } catch (err) {
        console.error("setLocalDescription(offer) ERROR: ", err);
      }
    };
    //＠重要：データチャネルはここでないとバグる
    this.dataChannel = this.createDatachannel(label);
  }

  setAnswer(sdp) {
    console.log("setAnswer", sdp);
    try {
      this.rtc.setRemoteDescription(sdp);
    } catch (err) {
      console.error("setRemoteDescription(answer) ERROR: ", err);
    }
  }

  async makeAnswer(sdp) {
    this.type = "answer";
    this.rtc = this._prepareNewConnection();
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

  send(data, label = null) {
    try {
      if (label === null) {
        this.dataChannel.send(data);
      } else {
        this.dataChannels[label].send(data);
      }
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
