import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TextInput } from 'react-native';


const Award = ({ icon, title, description }: { icon: string; title: string; description: string }) => (
  <View style={styles.awardContainer}>
    <Text style={styles.awardIcon}>{icon}</Text>
    <View style={styles.awardTextContainer}>
      <Text style={styles.awardTitle}>{title}</Text>
      <Text style={styles.awardDescription}>{description}</Text>
    </View>
  </View>
);

export default function ProfileScreen() {
  const [name, setName] = useState('Ani');
  const [location, setLocation] = useState('Scottsdale, Arizona');
  const [joinDate] = useState('Joined: September 2025');
  const [skillsHave, setSkillsHave] = useState('Guitar Lessons\nBasic Spanish');
  const [skillsWant, setSkillsWant] = useState('Bike Repair\nCooking');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://randomuser.me/api/portraits/women/48.jpg' }}
          style={styles.profileImage}
        />
        <TextInput style={styles.name} value={name} onChangeText={setName} />
        <TextInput style={styles.location} value={location} onChangeText={setLocation} />
        <Text style={styles.joinDate}>{joinDate}</Text>
      </View>

      {}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ratings & Awards</Text>
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingText}>Community Rating:</Text>
          <Text style={styles.stars}>★★★★☆ (4.8)</Text>
        </View>
        <Award
          icon="🏆"
          title="Weekly Top Swapper"
          description="Most hours served last week"
        />
      </View>
      {}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skills I Have</Text>
        <TextInput
          style={styles.textArea}
          value={skillsHave}
          onChangeText={setSkillsHave}
          multiline={true}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skills I Want</Text>
        <TextInput
          style={styles.textArea}
          value={skillsWant}
          onChangeText={setSkillsWant}
          multiline={true}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    padding: 5,
    width: '80%',
    textAlign: 'center',
  },
  location: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    padding: 5,
    width: '80%',
    textAlign: 'center',
  },
  joinDate: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 10,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  textArea: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    padding: 15,
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
  },
 
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  ratingText: {
    fontSize: 16,
  },
  stars: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFC107', 
  },
  awardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5E1',
    borderRadius: 8,
    padding: 15,
  },
  awardIcon: {
    fontSize: 30,
    marginRight: 15,
  },
  awardTextContainer: {
    flex: 1,
  },
  awardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  awardDescription: {
    fontSize: 14,
    color: '#666',
  },
});