import { MdSearch, MdClose } from 'react-icons/md';

const SearchBar = ({ value, onChange, placeholder = 'Search...', onClear }) => (
  <div className="relative">
    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="input pl-10 pr-9 w-full"
    />
    {value && (
      <button
        onClick={() => { onChange(''); onClear?.(); }}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        <MdClose />
      </button>
    )}
  </div>
);

export default SearchBar;
