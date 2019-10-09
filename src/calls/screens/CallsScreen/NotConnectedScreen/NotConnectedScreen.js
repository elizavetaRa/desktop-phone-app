import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { translate } from 'react-i18next';
import { Header, Modal } from 'semantic-ui-react';
import { Redirect } from 'react-router-dom';

import ErrorBoundary from 'common/components/ErrorBoundary/ErrorBoundary';
import ErrorMessageContainer from 'common/components/ErrorMessage/ErrorMessageContainer';
import LogoutButtonContainer from 'auth/components/LogoutButton/LogoutButtonContainer';
import NumberConnectorContainer from 'calls/components/NumberConnector/NumberConnectorContainer';
import { DownloadDebugLogsButton } from 'debug/components/DownloadDebugLogsButton/DownloadDebugLogsButton';
import SettingsButtonContainer from 'common/components/SettingsButton/SettingsButtonContainer';
import SettingsModalContainer from 'settings/components/SettingsModal/SettingsModalContainer';

function SelectPhoneNumberModal() {
  return (
    <Modal open={true} size="small" className="SelectPhoneModal">
      <Header icon="phone" content="Select a phone number" />
      <Modal.Content>
        <ErrorMessageContainer />
        <p>
          Select which one of your phone numbers you want to use with this
          client.
        </p>
        <NumberConnectorContainer />
        <hr />
        <DownloadDebugLogsButton floated="right" />
        <SettingsButtonContainer floated="right" />
        <LogoutButtonContainer color="red" />
      </Modal.Content>
    </Modal>
  );
}

SelectPhoneNumberModal.propTypes = {
  modalOpen: PropTypes.bool.isRequired
};

function NotConnectedScreen({
  isAuthenticated,
  connected,
  firstNumberAvailable,
  numberOfMobileNumbers,
  setActiveNumber,
  phoneService
}) {
  useEffect(() => {
    if (1 === numberOfMobileNumbers) {
      setActiveNumber(firstNumberAvailable);
      const result = phoneService.authenticateUser(firstNumberAvailable);
      console.log(result);
    }
  }, [numberOfMobileNumbers]);

  if (!isAuthenticated) return <Redirect to="/login" />;
  if (connected) return <Redirect to="/home" />;

  return (
    <ErrorBoundary>
      <SettingsModalContainer />
      <SelectPhoneNumberModal />
    </ErrorBoundary>
  );
}

NotConnectedScreen.propTypes = {
  t: PropTypes.func.isRequired
};

export default translate('calls')(NotConnectedScreen);
