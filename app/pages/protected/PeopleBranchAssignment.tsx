import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { supabase } from '../../utils/supabaseClient';
import { FaCheck, FaEdit, FaTimes } from 'react-icons/fa';

const PeopleBranchAssignment = () => {
  const [people, setPeople] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<{ [personId: string]: Set<string> }>({});
  const [editPerson, setEditPerson] = useState<any | null>(null);
  const [editBranches, setEditBranches] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [branchSearch, setBranchSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      supabase.from('people').select('id, name, type').eq('type', 'customer').order('name'),
      supabase.from('branches').select('id, name').order('name'),
      supabase.from('people_branches').select('person_id, branch_id'),
    ]).then(([peopleRes, branchesRes, assignmentsRes]) => {
      setPeople(peopleRes.data || []);
      setBranches(branchesRes.data || []);
      // Build assignments map
      const map: { [personId: string]: Set<string> } = {};
      (assignmentsRes.data || []).forEach((row: any) => {
        if (!map[row.person_id]) map[row.person_id] = new Set();
        map[row.person_id].add(row.branch_id);
      });
      setAssignments(map);
      setLoading(false);
    });
  }, []);

  const openEditModal = (person: any) => {
    setEditPerson(person);
    setEditBranches(new Set(assignments[person.id] || []));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditPerson(null);
    setEditBranches(new Set());
  };

  const handleToggleBranch = (branchId: string) => {
    const newSet = new Set(editBranches);
    if (newSet.has(branchId)) newSet.delete(branchId);
    else newSet.add(branchId);
    setEditBranches(newSet);
  };

  const handleSave = async () => {
    if (!editPerson) return;
    setSaving(true);
    // Get current assignments
    const current = assignments[editPerson.id] || new Set();
    const toAdd = Array.from(editBranches).filter(b => !current.has(b));
    const toRemove = Array.from(current).filter(b => !editBranches.has(b));
    // Add new assignments
    if (toAdd.length > 0) {
      await supabase.from('people_branches').insert(toAdd.map(branch_id => ({ person_id: editPerson.id, branch_id })));
    }
    // Remove unassigned
    if (toRemove.length > 0) {
      for (const branch_id of toRemove) {
        await supabase.from('people_branches').delete().eq('person_id', editPerson.id).eq('branch_id', branch_id);
      }
    }
    // Update local state
    setAssignments(prev => ({ ...prev, [editPerson.id]: new Set(editBranches) }));
    setSaving(false);
    setToast('Assignments updated!');
    setTimeout(() => setToast(null), 2000);
    closeModal();
  };

  const filteredPeople = people.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const filteredBranches = branches.filter(b => b.name.toLowerCase().includes(branchSearch.toLowerCase()));

  return (
    <AdminLayout title="People Branch Assignment" breadcrumb={<span>Settings &gt; <span className="text-gray-900">People Branch Assignment</span></span>}>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="col-span-full mb-6">
          <input
            type="text"
            placeholder="Search people..."
            className="w-full border rounded-lg px-3 py-2 max-w-md"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="col-span-full text-center text-gray-400 py-12">Loading...</div>
        ) : filteredPeople.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-12">No people found.</div>
        ) : (
          filteredPeople.map(person => (
            <div key={person.id} className="bg-white rounded-xl shadow p-6 flex flex-col gap-3 relative">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg font-bold text-gray-900">{person.name}</span>
                <span className="text-xs text-gray-500">({person.type})</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {(assignments[person.id] && assignments[person.id].size > 0) ? (
                  Array.from(assignments[person.id]).map(branchId => {
                    const branch = branches.find(b => b.id === branchId);
                    return branch ? (
                      <span key={branch.id} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                        {branch.name}
                      </span>
                    ) : null;
                  })
                ) : (
                  <span className="text-gray-400 text-xs">No branches assigned</span>
                )}
              </div>
              <button
                className="mt-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 self-end"
                onClick={() => openEditModal(person)}
              >
                <FaEdit /> Edit
              </button>
            </div>
          ))
        )}
      </div>
      {/* Modal */}
      {modalOpen && editPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/60">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative animate-fade-in">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-red-500" onClick={closeModal}><FaTimes size={20} /></button>
            <h2 className="text-2xl font-bold mb-4">Assign Branches to <span className="text-blue-700">{editPerson.name}</span></h2>
            <input
              type="text"
              placeholder="Search branches..."
              className="w-full border rounded-lg px-3 py-2 mb-4"
              value={branchSearch}
              onChange={e => setBranchSearch(e.target.value)}
            />
            <div className="max-h-64 overflow-y-auto divide-y rounded-lg border">
              {filteredBranches.length === 0 ? (
                <div className="p-4 text-gray-400 text-center">No branches found.</div>
              ) : filteredBranches.map(branch => {
                const alreadyAssigned = assignments[editPerson.id]?.has(branch.id);
                return (
                  <label key={branch.id} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={editBranches.has(branch.id)}
                      onChange={() => handleToggleBranch(branch.id)}
                      disabled={alreadyAssigned || saving}
                    />
                    <span className="flex-1">{branch.name}</span>
                    {editBranches.has(branch.id) && <FaCheck className="text-green-500" />}
                    {alreadyAssigned && (
                      <span className="text-xs text-gray-400 ml-2">(Already assigned)</span>
                    )}
                  </label>
                );
              })}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-black text-white px-6 py-3 rounded-full shadow-lg z-50">{toast}</div>
      )}
    </AdminLayout>
  );
};

export default PeopleBranchAssignment; 