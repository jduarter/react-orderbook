import * as React from 'react';

import { View, StyleSheet } from 'react-native';

import GroupButton from './GroupButton';
import { getGroupByButtonPressEventHandler } from '../utils';

interface GroupByButtonGroupProps {
  groupBy: number;
  orderBookDispatch: React.Dispatch<any>;
  availableFactors: number[];
}

const GroupByButtonGroup: React.FC<GroupByButtonGroupProps> = ({
  groupBy,
  orderBookDispatch,
  availableFactors,
}) => (
  <View style={styles.groupByButtonsWrap}>
    <GroupButton
      title={'-'}
      style={styles.flex1}
      onPress={getGroupByButtonPressEventHandler(
        -1,
        groupBy,
        orderBookDispatch,
        availableFactors,
      )}
    />
    <GroupButton
      title={'+'}
      style={styles.flex1}
      onPress={getGroupByButtonPressEventHandler(
        1,
        groupBy,
        orderBookDispatch,
        availableFactors,
      )}
    />
  </View>
);

export default GroupByButtonGroup;

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  groupByButtonsWrap: { padding: 4, flex: 1, flexDirection: 'row' },
});
