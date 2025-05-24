import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  FlatList,
  Dimensions,
  Platform,
  TextInput,
  StyleSheet
} from 'react-native';
import { Image } from 'react-native';
import { EMOJI_LIBRARY, DEFAULT_SHORTHAND_EMOJIS, EmojiData, EMOJI_CATEGORIES } from '@/constants/emojiLibrary';
import { useAlert } from '@/notifications/AlertContext';
import { useEmojiPreferences } from '@/hooks/useEmojiPreferences';
import { icons } from '@/constants';

const { width, height } = Dimensions.get('window');
const EMOJI_SIZE = 44;
const EMOJIS_PER_ROW = Math.floor((width - 80) / (EMOJI_SIZE + 8));
const MODAL_HEIGHT = height * 0.75;
const BUTTON_HEIGHT = 80;

interface EmojiSettingsProps {
  onClose?: () => void;
}

const styles = StyleSheet.create({
  container: {
    height: MODAL_HEIGHT,
    backgroundColor: '#FAFAFA',
    position: 'relative',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: BUTTON_HEIGHT,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Jakarta-Bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Jakarta-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  previewContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewTitle: {
    fontSize: 12,
    fontFamily: 'Jakarta-Medium',
    color: '#374151',
    marginBottom: 12,
  },
  previewGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewSlot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  previewSlotFilled: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  previewSlotEmpty: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  previewEmoji: {
    fontSize: 18,
  },
  previewNumber: {
    fontSize: 12,
    fontFamily: 'Jakarta-Medium',
    color: '#9CA3AF',
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
    margin: 4,
    borderRadius: 12,
    borderWidth: 2,
    position: 'relative',
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
    fontSize: 24,
  },
  selectionBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionNumber: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Jakarta-Bold',
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
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BUTTON_HEIGHT,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    zIndex: 1000,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {
    backgroundColor: '#F3F4F6',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  saveButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Jakarta-Medium',
  },
  resetButtonText: {
    color: '#374151',
  },
  saveButtonText: {
    color: 'white',
  },
  saveButtonTextDisabled: {
    color: '#9CA3AF',
  },
});

const EmojiSettings: React.FC<EmojiSettingsProps> = ({ onClose }) => {
  const { showAlert } = useAlert();
  const { shorthandEmojis, saveEmojiPreferences, resetEmojiPreferences } = useEmojiPreferences();
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>(DEFAULT_SHORTHAND_EMOJIS);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    setSelectedEmojis(shorthandEmojis);
  }, [shorthandEmojis]);

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

    // Sort selected emojis to the top
    const selectedEmojiObjects = filtered.filter(emoji =>
      selectedEmojis.includes(emoji.emoji)
    );
    const unselectedEmojiObjects = filtered.filter(emoji =>
      !selectedEmojis.includes(emoji.emoji)
    );

    return [...selectedEmojiObjects, ...unselectedEmojiObjects];
  }, [searchQuery, selectedCategory, selectedEmojis]);

  const handleEmojiSelect = (emoji: string) => {
    if (selectedEmojis.includes(emoji)) {
      // Remove emoji if already selected
      setSelectedEmojis(prev => prev.filter(e => e !== emoji));
    } else if (selectedEmojis.length < 6) {
      // Add emoji if less than 6 selected
      setSelectedEmojis(prev => [...prev, emoji]);
    } else {
      showAlert({
        title: "Maximum Reached",
        message: "You can only select up to 6 emojis for quick reactions.",
        type: "WARNING",
        status: "warning"
      });
    }
  };

  const handleSave = async () => {
    if (selectedEmojis.length !== 6) {
      showAlert({
        title: "Incomplete Selection",
        message: "Please select exactly 6 emojis for your quick reactions.",
        type: "WARNING",
        status: "warning"
      });
      return;
    }

    try {
      setSaving(true);
      const success = await saveEmojiPreferences(selectedEmojis);

      if (success) {
        showAlert({
          title: "Success",
          message: "Your emoji preferences have been saved to this device!",
          type: "SUCCESS",
          status: "success"
        });

        if (onClose) {
          setTimeout(onClose, 1500);
        }
      } else {
        throw new Error('Failed to save to storage');
      }
    } catch (error) {
      console.error('Failed to save emoji preferences to storage:', error);
      showAlert({
        title: "Error",
        message: "Failed to save your emoji preferences. Please try again.",
        type: "ERROR",
        status: "error"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      "Reset to Default",
      "Are you sure you want to reset to the default emoji selection?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            setSelectedEmojis([...DEFAULT_SHORTHAND_EMOJIS]);
            await resetEmojiPreferences();
          }
        }
      ]
    );
  };

  const renderEmojiItem = ({ item }: { item: EmojiData }) => {
    const isSelected = selectedEmojis.includes(item.emoji);
    const selectionIndex = selectedEmojis.indexOf(item.emoji);

    return (
      <TouchableOpacity
        onPress={() => handleEmojiSelect(item.emoji)}
        style={[
          styles.emojiItem,
          isSelected ? styles.emojiItemSelected : styles.emojiItemUnselected
        ]}
        activeOpacity={0.7}
      >
        <Text style={styles.emojiText}>
          {item.emoji}
        </Text>

        {isSelected && (
          <View style={styles.selectionBadge}>
            <Text style={styles.selectionNumber}>
              {selectionIndex + 1}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderPreviewSlot = (index: number) => (
    <View
      key={`slot-${index}`}
      style={[
        styles.previewSlot,
        selectedEmojis[index] ? styles.previewSlotFilled : styles.previewSlotEmpty
      ]}
    >
      {selectedEmojis[index] ? (
        <Text style={styles.previewEmoji}>
          {selectedEmojis[index]}
        </Text>
      ) : (
        <Text style={styles.previewNumber}>
          {index + 1}
        </Text>
      )}
    </View>
  );

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
            Customize Quick Reactions
          </Text>
          <Text style={styles.subtitle}>
            Select 6 emojis for your quick reaction shortcuts
          </Text>
        </View>

        {/* Selected Emojis Preview */}
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>
            Selected ({selectedEmojis.length}/6):
          </Text>
          <View style={styles.previewGrid}>
            {Array.from({ length: 6 }).map((_, index) => renderPreviewSlot(index))}
          </View>
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

      {/* Fixed Button Container */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={handleReset}
          style={[styles.button, styles.resetButton]}
          disabled={saving}
        >
          <Text style={[styles.buttonText, styles.resetButtonText]}>
            Reset
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSave}
          style={[
            styles.button,
            selectedEmojis.length === 6 && !saving ? styles.saveButton : styles.saveButtonDisabled
          ]}
          disabled={selectedEmojis.length !== 6 || saving}
        >
          <Text style={[
            styles.buttonText,
            selectedEmojis.length === 6 && !saving ? styles.saveButtonText : styles.saveButtonTextDisabled
          ]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default EmojiSettings;
