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
  fetchPlans,
  insertPlan,
  updatePlanInDb,
  deletePlanFromDb,
} from '../lib/supabase';

interface PlanItem {
  id: string;
  title: string;
  category: 'Cita' | 'Reto' | 'Deseo';
  completed: boolean;
}

interface PlansScreenProps {
  account?: CoupleAccount;
}

const INITIAL_PLANS: PlanItem[] = [
  {
    id: '1',
    title: 'Cena a la luz de las velas sin celulares',
    category: 'Cita',
    completed: true,
  },
  {
    id: '2',
    title: 'Noche de preguntas profundas con antifaz o ojos vendados',
    category: 'Deseo',
    completed: false,
  },
  {
    id: '3',
    title: 'Escapada de fin de semana a una cabaña o hotel boutique',
    category: 'Cita',
    completed: false,
  },
  {
    id: '4',
    title: 'Escribir 3 cosas que nos encantan del otro y leerlas juntos',
    category: 'Reto',
    completed: true,
  },
  {
    id: '5',
    title: 'Sesión de masaje relajante con aceites y música suave',
    category: 'Deseo',
    completed: false,
  },
];

export const PlansScreen: React.FC<PlansScreenProps> = ({account}) => {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'Todos' | 'Cita' | 'Reto' | 'Deseo'>(
    'Todos',
  );
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'Cita' | 'Reto' | 'Deseo'>(
    'Reto',
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<'Cita' | 'Reto' | 'Deseo'>(
    'Reto',
  );

  useEffect(() => {
    if (!account?.id) {
      return;
    }
    const loadRemotePlans = async () => {
      setLoading(true);
      try {
        const remote = await fetchPlans(account.id!);
        if (remote) {
          setPlans(
            remote.map(r => ({
              id: r.id,
              title: r.title,
              category: r.category,
              completed: r.completed,
            })),
          );
        }
      } catch (err) {
        console.warn('Error loading plans from Supabase:', err);
      } finally {
        setLoading(false);
      }
    };
    loadRemotePlans();
  }, [account?.id]);

  const togglePlan = async (id: string) => {
    const target = plans.find(p => p.id === id);
    const newCompleted = target ? !target.completed : true;

    setPlans(prev =>
      prev.map(item =>
        item.id === id ? {...item, completed: newCompleted} : item,
      ),
    );

    if (account?.id) {
      try {
        await updatePlanInDb(id, {completed: newCompleted});
      } catch (err) {
        console.warn('Error toggling plan in Supabase:', err);
      }
    }
  };

  const addPlan = async () => {
    if (!newTitle.trim()) {
      return;
    }
    const tempId = Date.now().toString();
    const created: PlanItem = {
      id: tempId,
      title: newTitle.trim(),
      category: newCategory,
      completed: false,
    };
    setPlans([created, ...plans]);
    const addedTitle = newTitle.trim();
    const addedCategory = newCategory;
    setNewTitle('');

    if (account?.id) {
      try {
        const saved = await insertPlan({
          couple_id: account.id,
          title: addedTitle,
          category: addedCategory,
          completed: false,
        });
        if (saved && saved.id) {
          setPlans(prev =>
            prev.map(p => (p.id === tempId ? {...p, id: saved.id} : p)),
          );
        }
      } catch (err) {
        console.warn('Error saving plan to Supabase:', err);
      }
    }
  };

  const startEdit = (item: PlanItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditCategory(item.category);
  };

  const saveEdit = async (id: string) => {
    if (!editTitle.trim()) {
      return;
    }
    const updatedTitle = editTitle.trim();
    const updatedCategory = editCategory;

    setPlans(prev =>
      prev.map(p =>
        p.id === id
          ? {...p, title: updatedTitle, category: updatedCategory}
          : p,
      ),
    );
    setEditingId(null);

    if (account?.id) {
      try {
        await updatePlanInDb(id, {
          title: updatedTitle,
          category: updatedCategory,
        });
      } catch (err) {
        console.warn('Error updating plan in Supabase:', err);
      }
    }
  };

  const deletePlan = async (id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id));
    if (account?.id) {
      try {
        await deletePlanFromDb(id);
      } catch (err) {
        console.warn('Error deleting plan from Supabase:', err);
      }
    }
  };

  const filteredPlans =
    filter === 'Todos' ? plans : plans.filter(p => p.category === filter);

  const completedCount = plans.filter(p => p.completed).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.overline}>AVENTURAS & FANTASÍAS</Text>
      <Text style={styles.title}>Citas, Retos y Deseos</Text>
      <Text style={styles.subtitle}>
        Completados: {completedCount} de {plans.length} experiencias juntos
      </Text>

      {/* Formulario para añadir nuevo plan */}
      <View style={styles.addCard}>
        <Text style={styles.addCardLabel}>PROPONER NUEVO PLAN O DESEO</Text>
        <TextInput
          style={styles.input}
          placeholder="Escribe una cita, reto o fantasía..."
          placeholderTextColor={COLORS.textMuted}
          value={newTitle}
          onChangeText={setNewTitle}
        />
        <View style={styles.addControlsRow}>
          <View style={styles.catSelector}>
            {(['Cita', 'Reto', 'Deseo'] as const).map(cat => (
              <TouchableOpacity
                key={cat}
                onPress={() => setNewCategory(cat)}
                style={[
                  styles.catMiniBtn,
                  newCategory === cat && styles.catMiniBtnActive,
                ]}>
                <Text
                  style={[
                    styles.catMiniText,
                    newCategory === cat && styles.catMiniTextActive,
                  ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.addButton} onPress={addPlan}>
            <Text style={styles.addButtonText}>+ Agregar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filterRow}>
        {(['Todos', 'Cita', 'Reto', 'Deseo'] as const).map(tab => {
          const active = filter === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setFilter(tab)}
              style={[styles.filterPill, active && styles.filterPillActive]}>
              <Text
                style={[styles.filterText, active && styles.filterTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Lista de Planes */}
      {filteredPlans.map(item => (
        <View
          key={item.id}
          style={[
            styles.planCard,
            item.completed && styles.planCardCompleted,
          ]}>
          {editingId === item.id ? (
            <View style={styles.flexOne}>
              <TextInput
                style={styles.input}
                value={editTitle}
                onChangeText={setEditTitle}
              />
              <View style={styles.addControlsRow}>
                <View style={styles.catSelector}>
                  {(['Reto', 'Deseo', 'Cita'] as const).map(cat => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setEditCategory(cat)}
                      style={[
                        styles.catMiniBtn,
                        editCategory === cat && styles.catMiniBtnActive,
                      ]}>
                      <Text
                        style={[
                          styles.catMiniText,
                          editCategory === cat && styles.catMiniTextActive,
                        ]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => saveEdit(item.id)}>
                  <Text style={styles.addButtonText}>Guardar ✓</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => togglePlan(item.id)}
                style={[
                  styles.checkbox,
                  item.completed && styles.checkboxChecked,
                ]}>
                {item.completed && <Text style={styles.checkMark}>✓</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.planInfo}
                onPress={() => togglePlan(item.id)}>
                <Text
                  style={[
                    styles.planTitle,
                    item.completed && styles.planTitleCompleted,
                  ]}>
                  {item.title}
                </Text>
                <View style={styles.badgeTag}>
                  <Text style={styles.badgeTagText}>{item.category}</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.catSelector}>
                <TouchableOpacity
                  style={styles.filterPill}
                  onPress={() => startEdit(item)}>
                  <Text style={styles.filterText}>✎</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.filterPill}
                  onPress={() => deletePlan(item.id)}>
                  <Text style={[styles.filterText, {color: COLORS.danger}]}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
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
  subtitle: {
    fontSize: 11.5,
    color: COLORS.taupe,
    marginTop: 3,
    marginBottom: 14,
    fontWeight: '600',
  },
  addCard: {
    backgroundColor: COLORS.wineVelvet,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
  },
  addCardLabel: {
    color: COLORS.goldLight,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.wineDeep,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 12.5,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginBottom: 10,
  },
  addControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catSelector: {
    flexDirection: 'row',
    gap: 6,
  },
  catMiniBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: COLORS.wineDeep,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
  },
  catMiniBtnActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.goldLight,
  },
  catMiniText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.taupe,
  },
  catMiniTextActive: {
    color: COLORS.textDark,
  },
  addButton: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addButtonText: {
    color: COLORS.textDark,
    fontWeight: '800',
    fontSize: 11.5,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: COLORS.wineVelvet,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
  },
  filterPillActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.goldLight,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.goldLight,
  },
  filterTextActive: {
    color: COLORS.textDark,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.wineVelvet,
    borderRadius: 15,
    padding: 13,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
  },
  planCardCompleted: {
    opacity: 0.72,
    backgroundColor: COLORS.wineDeep,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.goldLight,
  },
  checkMark: {
    color: COLORS.textDark,
    fontSize: 11.5,
    fontWeight: '900',
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.creamLight,
    marginBottom: 4,
  },
  planTitleCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.taupe,
  },
  badgeTag: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.wineDeep,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeTagText: {
    color: COLORS.goldLight,
    fontSize: 9.5,
    fontWeight: '700',
  },
  flexOne: {
    flex: 1,
  },
});

