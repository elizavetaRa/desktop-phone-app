import React, { Children } from 'react';
import PropTypes from 'prop-types';

import { Dial } from 'tone-api-web';

import {
  errorMessage,
  infoMessage,
  logEvent,
  logMessage,
  toneInMessage,
  toneOutMessage
} from 'common/utils/logs';

const ringToneId = 'ringTone';
const ringBackToneId = 'ringbackTone';
const callInputId = 'callsAudioInput';

/**
 * Interfaces between Telephony API and UI
 */
export default class PhoneProvider extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    // Calls attrs
    authToken: PropTypes.string,
    doNotDisturb: PropTypes.bool.isRequired,
    call: PropTypes.shape({
      recipient: PropTypes.shape({}),
      caller: PropTypes.shape({}),
      startTime: PropTypes.number,
      onCall: PropTypes.bool
    }),
    // Calls funcs
    requestRegistration: PropTypes.func.isRequired,
    setRegistrationSuccess: PropTypes.func.isRequired,
    requestDisconnection: PropTypes.func.isRequired,
    setMakeCallRequest: PropTypes.func.isRequired,
    setIsCalling: PropTypes.func.isRequired,
    setIsReceivingCall: PropTypes.func.isRequired,
    setCallFailed: PropTypes.func.isRequired,
    addRecentCall: PropTypes.func.isRequired,
    setCallFinished: PropTypes.func.isRequired,
    setCallMissed: PropTypes.func.isRequired,
    setCallAccepted: PropTypes.func.isRequired,
    setDisconnectionSuccess: PropTypes.func.isRequired,
    setRegistrationFailure: PropTypes.func.isRequired,
    addAdditionalCall: PropTypes.func.isRequired,
    removeAdditionalCall: PropTypes.func.isRequired,
    // Notifications
    success: PropTypes.func.isRequired,
    info: PropTypes.func,
    warning: PropTypes.func
  };

  static defaultProps = {
    call: {}
  };

  static childContextTypes = {
    phoneService: PropTypes.shape({
      authenticateUser: PropTypes.func.isRequired,
      makeCall: PropTypes.func.isRequired
    }).isRequired
  };

  state = {
    phoneService: this
  };

  registeredNotificationOpts = {
    // uid: 'once-please', // you can specify your own uid if required
    title: 'You are connected now',
    position: 'tr',
    autoDismiss: 2
  };

  unRegisteredNotificationOpts = {
    // uid: 'once-please', // you can specify your own uid if required
    title: 'You have been disconnected',
    message: `You won't be able to make or receive any calls until you connect again`,
    position: 'tr',
    autoDismiss: 4
  };

  callTerminatedNotificationOpts = {
    // uid: 'once-please', // you can specify your own uid if required
    title: 'The call was terminated',
    position: 'tr',
    autoDismiss: 2
  };

  getChildContext() {
    const { phoneService } = this.state;
    return { phoneService };
  }

  componentDidMount() {
    this.audioElement = document.getElementById(callInputId);
    this.setState(
      {
        dialAPI: new Dial(this.audioElement)
      },
      () => {
        this.addListeners();
      }
    );
  }

  /**
   * Only for testing purposes.
   */
  sayHi = () => {
    logMessage('Hello!');
  };

  acceptIncomingCall = () => {
    const { dialAPI } = this.state;
    toneOutMessage(`Accepting incoming call`);
    dialAPI.answer();
  };

  addListeners = () => {
    const { dialAPI } = this.state;

    this.notifier = dialAPI.getNotifier();
    if (this.notifier) {
      this.notifier.on('ToneEvent', event => {
        this.eventHandler(event);
      });
    }
  };

  /**
   * Authenticates the user using the Telephony API
   * @param username
   * @returns {boolean|void|*}
   */
  authenticateUser = username => {
    const {
      authToken,
      requestRegistration,
      setToneToken,
      toneToken,
      clearAuthToken
    } = this.props;
    const { dialAPI } = this.state;

    logEvent('calls', `authenticate`, `user: ${username}.`);
    toneOutMessage(`Authenticating user: ${username}/*****`);
    requestRegistration();
    let tempToken;
    if (authToken) {
      tempToken = authToken;
    } else {
      tempToken = toneToken;
    }
    const eToken = dialAPI.authenticate(username, tempToken);
    if (authToken) {
      clearAuthToken();
      setToneToken(eToken);
    }
  };

  hangUpCurrentCallAction = () => {
    const { dialAPI } = this.state;
    toneOutMessage(`Hang up current call`);
    return dialAPI.hangUp();
  };

  hangUpCallEvent = () => {
    // const { username } = this.state;
    const { setCallFinished } = this.props;
    // logEvent("calls", `hangUp`, `caller: ${username}.`);
    setCallFinished();
  };

  /**
   * Makes a call to another person given his/her data
   * @param name Name of the person
   * @param phoneNumber Phone number
   * @returns {*}
   */
  makeCall = ({ name, phoneNumber }) => {
    const { setMakeCallRequest, setIsCalling } = this.props;
    const { dialAPI } = this.state;

    // toneOutMessage(`Calling user ${name} with number ${phoneNumber}`);
    // logEvent(
    //   'calls',
    //   `make`,
    //   `caller: ${username}. callee: ${name}. number: ${phoneNumber}`
    // );
    setMakeCallRequest({
      name,
      phoneNumber
    });
    this.playRingbacktone();
    setIsCalling();
    return dialAPI.call(phoneNumber);
  };

  playRingbacktone = () => {
    document
      .getElementById(ringBackToneId)
      .play()
      .catch(() => {
        errorMessage('RingbackTone play() raised an error.');
      });
  };

  playRingTone = () => {
    const { doNotDisturb } = this.props;
    if (!doNotDisturb) {
      document
        .getElementById(ringToneId)
        .play()
        .catch(() => {
          errorMessage('RingTone play() raised an error.');
        });
    }
  };

  sendDtmfCommand = tone => {
    const { dialAPI } = this.state;
    dialAPI.sendDTMF(tone);
  };

  stopRingbacktone = () => {
    document.getElementById(ringBackToneId).pause();
  };

  stopRingTone = () => {
    const { doNotDisturb } = this.props;
    if (!doNotDisturb) {
      document.getElementById(ringToneId).pause();
    }
  };

  receiveCall = ({ callerNumber, callerName }) => {
    const { setIsReceivingCall } = this.props;
    logMessage('Is receiving call');
    this.playRingTone();
    setIsReceivingCall(callerNumber, callerName);
  };

  /**
   * Method that must be called when an incoming call is rejected.
   * It performs all the actions needed by this action.
   */
  rejectIncomingCall = () => {
    const { dialAPI } = this.state;
    dialAPI.hangUp();
  };

  /**
   * Logs the user out of TONE
   */
  unAuthenticateUser = () => {
    const { setCallFinished, requestDisconnection, call: onCall } = this.props;
    const { dialAPI } = this.state;
    toneOutMessage(`UnAuthenticating user`);

    if (onCall) {
      setCallFinished();
    }
    requestDisconnection(true);
    return dialAPI.stopAgent();
  };

  addCallToRecentCalls = () => {
    logMessage(`addCallToRecentCalls`);
    const {
      addRecentCall,
      call: { recipient, caller, receivingCall, startTime, onCall }
    } = this.props;
    addRecentCall(
      receivingCall ? caller : recipient,
      receivingCall,
      !onCall,
      startTime
    );
  };

  handleProgressEvent = () => {
    const { setIsCalling } = this.props;
    this.playRingbacktone();
    setIsCalling(true);
  };

  handleCancelEvent = () => {
    this.stopRingbacktone();
    this.stopRingTone();
  };

  /**
   * =======
   * EVENTS
   * =======
   */

  eventHandler = event => {
    toneInMessage(`Tone Event received: ${event.name}`);
    toneInMessage(event);

    switch (event.name) {
      case 'registered':
        this.handleRegisteredEvent();
        break;
      case 'unregistered':
        this.handleUnregisteredEvent();
        break;
      case 'terminated':
        this.handleTerminatedEvent();
        break;
      case 'accepted':
        this.handleAcceptedEvent();
        break;
      case 'rejected':
        // TODO: Detail doesn't include error field nor error code
        this.handleRejectedEvent();
        break;
      case 'inviteReceived':
        this.handleInviteReceivedEvent(event);
        break;
      case 'failed':
        this.handleCallFailedEvent();
        break;
      case 'progress':
        this.handleProgressEvent();
        break;
      case 'trackAdded':
        this.handleTrackAddedEvent(event);
        break;

      case 'cancel':
        this.handleCancelEvent();
        break;

      case 'registrationFailed':
        this.handleRegistationFailedEvent(event);
        break;
      default:
        errorMessage(`Unhandled event: ${event.name}`);
    }
  };

  handleRegisteredEvent() {
    const { setRegistrationSuccess } = this.props;
    setRegistrationSuccess();
  }

  handleInviteReceivedEvent(event) {
    const { setIsReceivingCall, call: onCall, addAdditionalCall } = this.props;

    if (onCall) {
      addAdditionalCall();
    } else {
      this.playRingTone();
    }
    // Retrieve the remote user information from the event data
    const { uri } = event.data.session.remoteIdentity;
    setIsReceivingCall(uri.user, null);
  }

  handleRejectedEvent() {
    const {
      setCallMissed,
      removeAdditionalCall,
      call: additionalCalls
    } = this.props;

    this.stopRingbacktone();
    this.stopRingTone();
    setCallMissed();

    if (additionalCalls.length > 0) {
      removeAdditionalCall();
    }
  }

  handleAcceptedEvent() {
    const { setCallAccepted } = this.props;
    this.stopRingbacktone();
    this.stopRingTone();
    setCallAccepted();
  }

  handleTerminatedEvent() {
    const { setCallFinished, call: caller } = this.props;
    this.addCallToRecentCalls(caller.missed);
    setCallFinished();
  }

  handleUnregisteredEvent() {
    const { setDisconnectionSuccess } = this.props;
    setDisconnectionSuccess();
  }

  handleRegistationFailedEvent(event) {
    const { setRegistrationFailure } = this.props;
    if (event.error !== undefined) {
      setRegistrationFailure(event.error);
    }
  }

  handleCallFailedEvent() {
    const { setCallFailed } = this.props;
    const tempFailedMessage = {
      code: {
        status_code: 'NI'
      },
      description: 'Call failed'
    };
    setCallFailed(tempFailedMessage);
  }

  handleTrackAddedEvent(event) {
    this.audioElement.srcObject = event.data.remoteStream;
    const playPromise = this.audioElement.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          infoMessage('On a call. Audio track playing');
        })
        .catch(error => {
          errorMessage('Unable to play the audio track.');
          errorMessage(error);
        });
    }
  }

  render() {
    const { children } = this.props;
    return Children.only(children);
  }
}
