import * as React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { TextInput, Card, Text, IconButton, useTheme } from 'react-native-paper';
import { substances, type Substance } from '@pharmasim/engine';

export function SubstanceSearchScreen({ navigation }: any) {
  const [query, setQuery] = React.useState('');
  const theme = useTheme();

  const filtered = substances.filter(s => 
    s.name.toLowerCase().includes(query.toLowerCase()) || 
    s.drugClass.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <TextInput
        mode="outlined"
        placeholder="Search for a substance..."
        value={query}
        onChangeText={setQuery}
        style={styles.searchBar}
        left={<TextInput.Icon icon="magnify" />}
      />
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Card 
            style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}
            onPress={() => navigation.navigate('Timeline', { newSubstanceId: item.id })}
          >
            <Card.Title 
              title={item.name} 
              subtitle={item.drugClass}
              titleStyle={{ color: theme.colors.onSurface }}
              subtitleStyle={{ color: theme.colors.onSurfaceVariant }}
              right={(props) => <IconButton {...props} icon="chevron-right" iconColor={theme.colors.onSurfaceVariant} />}
            />
          </Card>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    margin: 16,
    backgroundColor: 'transparent',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    marginBottom: 12,
  }
});
