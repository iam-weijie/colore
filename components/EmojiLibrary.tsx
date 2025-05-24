import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
  Platform,
  StyleSheet
} from 'react-native';
import { EMOJI_LIBRARY, EMOJI_CATEGORIES, EmojiData } from '@/constants/emojiLibrary';
import { icons } from '@/constants';
import { Image } from 'react-native';

interface EmojiLibraryProps {
  onEmojiSelected: (emoji: string) => void;
  selectedEmoji?: string | null;
}

const { width, height } = Dimensions.get('window');
const EMOJI_SIZE = 48;
const EMOJIS_PER_ROW = Math.floor((width - 80) / (EMOJI_SIZE + 12));
const MODAL_HEIGHT = height * 0.75;

const styles = StyleSheet.create({
  container: {
    height: MODAL_HEIGHT,
    backgroundColor: '#FAFAFA',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Jakarta-Bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  searchContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    width: 16,
    height: 16,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Jakarta-Medium',
    color: '#374151',
  },
  categoriesContainer: {
    height: 40,
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  categoryButtonActive: {
    backgroundColor: '#3B82F6',
  },
  categoryButtonInactive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'Jakarta-Medium',
    textTransform: 'capitalize',
  },
  categoryTextActive: {
    color: 'white',
  },
  categoryTextInactive: {
    color: '#374151',
  },
  emojiGrid: {
    flex: 1,
  },
  emojiItem: {
    width: EMOJI_SIZE,
    height: EMOJI_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 6,
    borderRadius: 12,
    borderWidth: 2,
  },
  emojiItemSelected: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  emojiItemUnselected: {
    backgroundColor: 'white',
    borderColor: '#E5E7EB',
  },
  emojiText: {
    fontSize: 28,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Jakarta-Medium',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Jakarta-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

const EmojiLibrary: React.FC<EmojiLibraryProps> = ({
  onEmojiSelected,
  selectedEmoji
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredEmojis = useMemo(() => {
    let filtered = EMOJI_LIBRARY;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(emoji =>
        emoji.categories.includes(selectedCategory)
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(emoji =>
        emoji.categories.some(category =>
          category.toLowerCase().includes(query)
        ) || emoji.id.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  const renderEmojiItem = ({ item }: { item: EmojiData }) => {
    const isSelected = selectedEmoji === item.emoji;

    return (
      <TouchableOpacity
        onPress={() => onEmojiSelected(item.emoji)}
        style={[
          styles.emojiItem,
          isSelected ? styles.emojiItemSelected : styles.emojiItemUnselected
        ]}
        activeOpacity={0.7}
      >
        <Text style={styles.emojiText}>
          {item.emoji}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCategoryItem = ({ item: category }: { item: string }) => (
    <TouchableOpacity
      onPress={() => setSelectedCategory(category)}
      style={[
        styles.categoryButton,
        selectedCategory === category ? styles.categoryButtonActive : styles.categoryButtonInactive
      ]}
    >
      <Text style={[
        styles.categoryText,
        selectedCategory === category ? styles.categoryTextActive : styles.categoryTextInactive
      ]}>
        {category}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Emoji Library
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Image
            source={icons.search}
            style={styles.searchIcon}
            tintColor="#6B7280"
          />
          <TextInput
            placeholder="Search emojis..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Category Filter */}
        <View style={styles.categoriesContainer}>
          <FlatList
            data={['all', ...EMOJI_CATEGORIES]}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              alignItems: 'center'
            }}
          />
        </View>

        {/* Emoji Grid */}
        <FlatList
          data={filteredEmojis}
          renderItem={renderEmojiItem}
          numColumns={EMOJIS_PER_ROW}
          keyExtractor={(item) => item.id}
          style={styles.emojiGrid}
          contentContainerStyle={{
            paddingBottom: 20
          }}
          showsVerticalScrollIndicator={true}
          columnWrapperStyle={{
            justifyContent: 'space-around',
            marginBottom: 8
          }}
          scrollEnabled={true}
          bounces={Platform.OS === 'ios'}
          overScrollMode={Platform.OS === 'android' ? 'never' : 'auto'}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          maxToRenderPerBatch={20}
          windowSize={10}
          initialNumToRender={20}
          nestedScrollEnabled={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                No emojis found
              </Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search or category filter
              </Text>
            </View>
          )}
        />
      </View>
    </View>
  );
};

export default EmojiLibrary;
