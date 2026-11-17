import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {COLORS} from '../theme/colors';
import {CoupleAccount} from '../data/assignedUsers';
import {
  fetchMemories,
  insertMemory,
  updateMemoryInDb,
  deleteMemoryFromDb,
} from '../lib/supabase';

interface MemoryNote {
  id: string;
  author: string;
  date: string;
  title: string;
  content: string;
}

interface MemoriesScreenProps {
  account: CoupleAccount;
}

export const MemoriesScreen: React.FC<MemoriesScreenProps> = ({account}) => {
  const [notes, setNotes] = useState<MemoryNote[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState(account.partnerOne);
  const [dateStr, setDateStr] = useState('Hoy');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isWriting, setIsWriting] = useState(false);

  useEffect(() => {
    if (!account?.id) {
      return;
    }
    const loadRemoteMemories = async () => {
      setLoading(true);
      try {
        const remote = await fetchMemories(account.id!);
        if (remote) {
          setNotes(
            remote.map(r => ({
              id: r.id,
              author: r.author,
              date: r.date_str,
              title: r.title,
              content: r.content,
            })),
          );
        }
      } catch (err) {
        console.warn('Error loading memories from Supabase:', err);
      } finally {
        setLoading(false);
      }
    };
    loadRemoteMemories();
  }, [account?.id]);

  const openNewNote = () => {
    setEditingId(null);
    setAuthor(account.partnerOne);
    setDateStr('Hoy');
    setTitle('');
    setBody('');
    setIsWriting(!isWriting);
  };

  const startEditNote = (note: MemoryNote) => {
    setEditingId(note.id);
    setAuthor(note.author);
    setDateStr(note.date);
    setTitle(note.title);
    setBody(note.content);
    setIsWriting(true);
  };

  const deleteNote = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (account?.id) {
      try {
        await deleteMemoryFromDb(id);
      } catch (err) {
        console.warn('Error deleting memory from Supabase:', err);
      }
    }
  };

  const handleSaveNote = async () => {
    if (!title.trim() || !body.trim()) {
      return;
    }
    const newAuthor = author;
    const newDate = dateStr.trim() || 'Hoy';
    const newTitle = title.trim();
    const newContent = body.trim();

    if (editingId) {
      setNotes(prev =>
        prev.map(n =>
          n.id === editingId
            ? {
                ...n,
                author: newAuthor,
                date: newDate,
                title: newTitle,
                content: newContent,
              }
            : n,
        ),
      );
      if (account?.id) {
        try {
          await updateMemoryInDb(editingId, {
            author: newAuthor,
            date_str: newDate,
            title: newTitle,
            content: newContent,
          });
        } catch (err) {
          console.warn('Error updating memory in Supabase:', err);
        }
      }
    } else {
      const tempId = Date.now().toString();
      const created: MemoryNote = {
        id: tempId,
        author: newAuthor,
        date: newDate,
        title: newTitle,
        content: newContent,
      };
      setNotes([created, ...notes]);

      if (account?.id) {
        try {
          const saved = await insertMemory({
            couple_id: account.id,
            author: newAuthor,
            date_str: newDate,
            title: newTitle,
            content: newContent,
          });
          if (saved && saved.id) {
            setNotes(prev =>
              prev.map(n => (n.id === tempId ? {...n, id: saved.id} : n)),
            );
          }
        } catch (err) {
          console.warn('Error creating memory in Supabase:', err);
        }
      }
    }
    setTitle('');
    setBody('');
    setEditingId(null);
    setIsWriting(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.overline}>CÁPSULA DE EMOCIONES</Text>
          <Text style={styles.title}>Cartas & Recuerdos</Text>
        </View>
        <TouchableOpacity style={styles.writeToggleBtn} onPress={openNewNote}>
          <Text style={styles.writeToggleText}>
            {isWriting ? 'Cerrar ✕' : '+ Escribir Carta'}
          </Text>
        </TouchableOpacity>
      </View>

      {isWriting && (
        <View style={styles.composerCard}>
          <Text style={styles.composerLabel}>
            {editingId ? 'EDITAR CARTA O RECUERDO' : 'DEDICAR UNA NOTA DE AMOR'}
          </Text>
          <View style={styles.noteHeader}>
            <View style={styles.authorSelectRow}>
              {[account.partnerOne, account.partnerTwo].map(p => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setAuthor(p)}
                  style={[
                    styles.authorPill,
                    author === p && {backgroundColor: COLORS.gold},
                  ]}>
                  <Text
                    style={[
                      styles.authorText,
                      author === p && {color: COLORS.wineDark},
                    ]}>
                    De: {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TextInput
            style={styles.inputTitle}
            placeholder="Título del recuerdo o carta..."
            placeholderTextColor={COLORS.textMuted}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.inputBody}
            placeholder="Escribe lo que sientes..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            value={body}
            onChangeText={setBody}
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveNote}>
            <Text style={styles.saveBtnText}>
              {editingId ? 'Guardar Cambios ✓' : 'Guardar en Nuestra Cápsula'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {notes.map(note => (
        <View key={note.id} style={styles.noteCard}>
          <View style={styles.noteHeader}>
            <View style={styles.authorPill}>
              <Text style={styles.authorText}>De: {note.author}</Text>
            </View>
            <View style={styles.noteActionsRow}>
              <Text style={styles.dateText}>{note.date}</Text>
              <TouchableOpacity onPress={() => startEditNote(note)}>
                <Text style={styles.dateText}>✎</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteNote(note.id)}>
                <Text style={[styles.dateText, styles.deleteNoteText]}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.noteTitle}>{note.title}</Text>
          <Text style={styles.noteContent}>{note.content}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.wineDeep,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 120,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  overline: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: COLORS.goldLight,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.creamLight,
    marginTop: 2,
  },
  writeToggleBtn: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.goldLight,
  },
  writeToggleText: {
    color: COLORS.textDark,
    fontSize: 11,
    fontWeight: '800',
  },
  composerCard: {
    backgroundColor: COLORS.wineVelvet,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
  },
  composerLabel: {
    color: COLORS.goldLight,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  inputTitle: {
    backgroundColor: COLORS.wineDeep,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
    paddingHorizontal: 12,
    height: 38,
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  inputBody: {
    backgroundColor: COLORS.wineDeep,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 74,
    textAlignVertical: 'top',
    fontSize: 12.5,
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.goldLight,
  },
  saveBtnText: {
    color: COLORS.textDark,
    fontWeight: '800',
    fontSize: 12,
  },
  noteCard: {
    backgroundColor: COLORS.wineVelvet,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorPill: {
    backgroundColor: COLORS.wineDeep,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  authorText: {
    color: COLORS.goldLight,
    fontSize: 10,
    fontWeight: '700',
  },
  dateText: {
    color: COLORS.taupe,
    fontSize: 10.5,
    fontWeight: '600',
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.creamLight,
    marginBottom: 4,
  },
  noteContent: {
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.taupe,
  },
  authorSelectRow: {
    flexDirection: 'row',
    gap: 6,
  },
  noteActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteNoteText: {
    color: COLORS.danger,
  },
});

