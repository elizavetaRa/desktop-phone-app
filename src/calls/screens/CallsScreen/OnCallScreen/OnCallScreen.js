import React, { Component } from 'react';
import { Grid, Segment } from 'semantic-ui-react';
import OnCallDetailsContainer from 'calls/components/OnCallDetails/OnCallDetailsContainer';
import RightColumn from 'common/components/RightColumn/RightColumn';
import ErrorBoundary from 'common/components/ErrorBoundary/ErrorBoundary';
import MainHeaderContainer from 'calls/components/MainHeader/MainHeaderContainer';
import DtmfDialpadForm from 'calls/components/dialpads/DtmfDialpadForm/DtmfDialpadForm';
import styles from 'calls/screens/CallsScreen/ConnectedScreen/ConnectedScreen.module.css';
import IncomingCallModalContainer from 'calls/components/call_modals/IncomingCallModal/IncomingCallModalContainer';

export class OnCallScreen extends Component {
  constructor(props) {
    super(props);
    this.state = { displayDialpad: false };
  }

  styles = { height: '100%' };

  dividedStyles = { paddingTop: '0', paddingBottom: 0 };

  toggleDialpad() {
    this.setState({ displayDialpad: !this.state.displayDialpad });
  }

  DtmfDialPad() {
    if (this.state.displayDialpad === true) {
      return (
        <Grid.Column>
          <Segment basic>
            <Grid.Column>
              <DtmfDialpadForm />
            </Grid.Column>
          </Segment>
        </Grid.Column>
      );
    }
    return null;
  }

  render() {
    return (
      <Grid.Column
        computer={12}
        mobile={16}
        tablet={16}
        className="CallsScreen__RightColumn"
      >
        <RightColumn>
          <div className={styles.innerContainer}>
            <MainHeaderContainer />
            <IncomingCallModalContainer />

            {this.renderMainContent()}
          </div>
        </RightColumn>
      </Grid.Column>
    );
  }

  renderMainContent() {
    return (
      <ErrorBoundary>
        <Grid padded style={this.styles}>
          <Grid.Row columns={(this.state.displayDialpad) ? 2 : 1 } divided style={this.dividedStyles}>
            <Grid.Column>
              <OnCallDetailsContainer toggleDialpad={() => this.toggleDialpad()}/>
            </Grid.Column>
            {this.DtmfDialPad()}
          </Grid.Row>
        </Grid>
      </ErrorBoundary>
    );
  }
}
