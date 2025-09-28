import { View, Text, StyleSheet, Image, Dimensions } from 'react-native'; 
import Swiper from 'react-native-deck-swiper';
import { DUMMY_PROFILES } from '../../constants/data';
import { Alert } from 'react-native';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function SwipeScreen() {
  return (
    <View style={styles.container}>
      <Swiper
       
        cards={DUMMY_PROFILES}
        renderCard={(card) => (
          <View style={styles.card}>
            <Image source={{ uri: card.photo }} style={styles.photo} />
            <Text style={styles.name}>{card.name}</Text>
            <Text style={styles.skillText}>
              Offers: {card.skillsOffer.join(', ')}
            </Text>
            <Text style={styles.skillText}>
              Wants: {card.skillsWant.join(', ')}
            </Text>
          </View>
        )}
        onSwipedRight={async (cardIndex) => {
  const swipedOnUser = DUMMY_PROFILES[cardIndex];
  const currentUser = { id: '2', name: 'Alex Chen' };

  console.log(`You swiped right on: ${swipedOnUser.name}`);

  try {
    await setDoc(doc(db, 'swipes', `${currentUser.id}_${swipedOnUser.id}`), {
      
    });

   
    const swipeDoc = await getDoc(
      doc(db, 'swipes', `${swipedOnUser.id}_${currentUser.id}`)
    );

    if (swipeDoc.exists()) {
      
      console.log('IT IS A MATCH!');
      Alert.alert(
        "It's a Match!",
        `You and ${swipedOnUser.name} have swiped on each other.`
      );
    }
  } catch (error) {
    console.error('Error writing document: ', error);
  }
}}
       
        verticalThreshold={Dimensions.get('window').height / 10}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  card: {
    flex: 0.7,
    borderRadius: 8,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  skillText: {
    fontSize: 16,
    color: '#555',
  },
});