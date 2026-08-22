import React, { useState } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Grid,
  List,
  PlusCircle,
  BookOpen,
  Star,
  Copy,
  Trash2,
  Edit2,
  Clock,
  CheckCircle2,
  FolderPlus,
  Sliders,
  MoreVertical,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storageService';
import { Project, ProjectStatus, ProjectType } from '../../types';

export const ProjectsView: React.FC = () => {
  const {
    projects,
    setIsNewBookWizardOpen,
    openProjectInEditor,
    duplicateProject,
    deleteProject,
    toggleFavoriteProject,
    showConfirmDialog,
    refreshProjects,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'name' | 'pages'>('updated');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Rename modal state
  const [renamingProject, setRenamingProject] = useState<Project | null>(null);
  const [newName, setNewName] = useState('');

  const typesList: string[] = [
    'All',
    'Puzzle Book',
    'Coloring Book',
    'Journal',
    'Planner',
    'Notebook',
    'Activity Book',
    'Custom Book',
  ];

  // Filtering
  const filteredProjects = projects
    .filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'All' || p.type === selectedType;
      const matchesStatus =
        selectedStatus === 'All'
          ? true
          : selectedStatus === 'Favorites'
          ? p.isFavorite
          : p.status === selectedStatus;
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'updated') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sortBy === 'created') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'pages') {
        return (b.pageCount || 0) - (a.pageCount || 0);
      }
      return 0;
    });

  const handleDelete = (project: Project) => {
    showConfirmDialog({
      title: 'Delete Book Project',
      message: `Are you sure you want to permanently delete "${project.name}" and all of its interior pages?`,
      confirmLabel: 'Delete Book',
      isDestructive: true,
      onConfirm: () => deleteProject(project.id),
    });
  };

  const handleSaveRename = () => {
    if (!renamingProject || !newName.trim()) return;
    const updated = {
      ...renamingProject,
      name: newName.trim(),
      updatedAt: new Date().toISOString(),
    };
    StorageService.saveProject(updated);
    refreshProjects();
    setRenamingProject(null);
    showToast({
      type: 'success',
      message: `Project renamed to "${newName.trim()}".`,
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & New Project CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white font-display">
            Book Projects
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Manage your manuscript interiors, page counts, and publishing pipelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNewBookWizardOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Book Wizard</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by book title, theme, or keywords..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Sort & View Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-600 dark:text-neutral-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-transparent focus:outline-none text-xs font-semibold cursor-pointer"
              >
                <option value="updated">Last Updated</option>
                <option value="created">Date Created</option>
                <option value="name">Alphabetical</option>
                <option value="pages">Page Count</option>
              </select>
            </div>

            <div className="flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Categories Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {typesList.map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                selectedType === type
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Display */}
      {filteredProjects.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
          <BookOpen className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
          <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-1">
            No projects matched your filter
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">
            Try adjusting your search criteria or create a brand new book.
          </p>
          <button
            onClick={() => setIsNewBookWizardOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs"
          >
            Launch New Book Wizard
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map(project => (
            <div
              key={project.id}
              className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex flex-col justify-between group"
            >
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                        {project.type}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        {project.kdpSettings.trimSize.name}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleFavoriteProject(project.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        project.isFavorite
                          ? 'text-amber-500 bg-amber-500/10'
                          : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
                      }`}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  <h3
                    onClick={() => openProjectInEditor(project.id)}
                    className="text-base font-bold text-neutral-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer transition-colors line-clamp-1 mb-1.5"
                  >
                    {project.name}
                  </h3>

                  <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed mb-4">
                    {project.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] text-neutral-400">
                    {project.pageCount} Pages • {project.status}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setRenamingProject(project);
                        setNewName(project.name);
                      }}
                      className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      title="Rename Book"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => duplicateProject(project.id)}
                      className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(project)}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openProjectInEditor(project.id)}
                      className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 font-bold text-xs transition-colors ml-1"
                    >
                      Edit Book
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-700/80 font-bold text-neutral-500">
              <tr>
                <th className="py-3.5 px-4">Title & Type</th>
                <th className="py-3.5 px-4">Trim & Specs</th>
                <th className="py-3.5 px-4">Pages</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Updated</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredProjects.map(project => (
                <tr
                  key={project.id}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => toggleFavoriteProject(project.id)}
                        className={`p-1 rounded ${
                          project.isFavorite ? 'text-amber-500' : 'text-neutral-300 dark:text-neutral-600'
                        }`}
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <div>
                        <div
                          onClick={() => openProjectInEditor(project.id)}
                          className="font-bold text-neutral-900 dark:text-white hover:text-amber-500 cursor-pointer"
                        >
                          {project.name}
                        </div>
                        <div className="text-[11px] text-neutral-500">{project.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-neutral-700 dark:text-neutral-300">
                    {project.kdpSettings.trimSize.name} • {project.kdpSettings.bleed}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-neutral-700 dark:text-neutral-300">
                    {project.pageCount}p
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      {project.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-neutral-400 text-[11px]">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => duplicateProject(project.id)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(project)}
                        className="p-1.5 text-neutral-400 hover:text-rose-600"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openProjectInEditor(project.id)}
                        className="px-3 py-1 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold text-xs ml-1"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rename Dialog */}
      {renamingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setRenamingProject(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />
          <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-2xl z-10 space-y-4">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white font-display">
              Rename Book Project
            </h3>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-900 dark:text-white"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRenamingProject(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRename}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950"
              >
                Save Name
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
